import { z } from 'zod'
import { type Result, success, failure, ValidationError, EntityNotFoundError } from '@/domain/errors'
import type { ICampaignRepository, IContactRepository, IEmailService, IWhatsAppService, ISmsService, ICampaignRecipientRepository, ICreditRepository } from '@/domain/interfaces'
import { Campaign } from '@/domain/entities'
import { normalizeBrazilianPhone } from '@/lib/utils'
import { creditsForCampaign } from '@/lib/credits'

// --- Schemas ---

const createCampaignSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(200),
    subject: z.string().max(998).optional(),  // RFC 2822: max 998 chars per header line
    body: z.string(),
    channel: z.enum(['email', 'sms', 'whatsapp']).default('email'),
})

const updateCampaignSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    subject: z.string().max(998).optional(),
    body: z.string().optional(),
    channel: z.enum(['email', 'sms', 'whatsapp']).optional(),
})

// --- Create Campaign ---

export class CreateCampaignUseCase {
    constructor(private readonly campaignRepo: ICampaignRepository) {}

    async execute(orgId: string, input: {
        name: string
        subject?: string
        body?: string
        channel?: string
    }): Promise<Result<Campaign>> {
        const parsed = createCampaignSchema.safeParse(input)
        if (!parsed.success) {
            return failure(new ValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos'))
        }

        const campaign = await this.campaignRepo.create({
            organizationId: orgId,
            name: parsed.data.name,
            subject: parsed.data.subject || '',
            body: parsed.data.body || '',
            channel: parsed.data.channel,
        })

        if (!campaign) return failure(new ValidationError('Erro ao criar campanha'))
        return success(campaign)
    }
}

// --- Update Campaign ---

export class UpdateCampaignUseCase {
    constructor(private readonly campaignRepo: ICampaignRepository) {}

    async execute(orgId: string, campaignId: string, input: {
        name?: string
        subject?: string
        body?: string
        channel?: string
    }): Promise<Result<Campaign>> {
        const parsed = updateCampaignSchema.safeParse(input)
        if (!parsed.success) {
            return failure(new ValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos'))
        }

        const campaign = await this.campaignRepo.update(campaignId, orgId, parsed.data)
        if (!campaign) return failure(new EntityNotFoundError('Campanha'))
        return success(campaign)
    }
}

// --- Send Campaign ---

const WHATSAPP_CONCURRENCY = 5

export class SendCampaignUseCase {
    constructor(
        private readonly campaignRepo: ICampaignRepository,
        private readonly contactRepo: IContactRepository,
        private readonly emailService: IEmailService,
        private readonly whatsAppService: IWhatsAppService,
        private readonly smsService: ISmsService,
        private readonly recipientRepo: ICampaignRecipientRepository,
        private readonly creditRepo?: ICreditRepository,
    ) {}

    async execute(orgId: string, campaignId: string, options?: { resend?: boolean; tags?: string[] }): Promise<Result<{ sent: number; failed: number }>> {
        const resend = options?.resend ?? false
        const tags = options?.tags

        // 1. Load campaign
        const campaign = await this.campaignRepo.findById(campaignId)
        if (!campaign || campaign.organizationId !== orgId) {
            return failure(new EntityNotFoundError('Campanha'))
        }

        if (resend) {
            if (!campaign.canResend()) {
                return failure(new ValidationError('Campanha não pode ser reenviada'))
            }
        } else {
            if (!campaign.canSend()) {
                return failure(new ValidationError(
                    campaign.isDraft()
                        ? 'Campanha precisa de conteúdo antes de enviar'
                        : 'Campanha já foi enviada',
                ))
            }
        }

        const channel = campaign.channel || 'email'
        let result: { sent: number; failed: number }

        if (channel === 'email') {
            const recipients = await this.contactRepo.findWithEmailByOrgId(orgId, tags)
            if (recipients.length === 0) {
                return failure(new ValidationError('Nenhum contato com email encontrado'))
            }

            await this.campaignRepo.updateStatus(campaignId, orgId, 'sending')

            const emails = recipients.map(contact => ({
                to: contact.email,
                subject: campaign.subject,
                html: this.personalizeBody(campaign.body, contact),
                tags: [campaignId],
            }))

            result = await this.emailService.sendBatch(emails)

            // Registrar destinatários (status geral — email não retorna SID por destinatário)
            await this.recipientRepo.bulkCreate(recipients.map((contact, i) => ({
                campaignId,
                organizationId: orgId,
                contactId: contact.id ?? null,
                contactName: contact.name,
                recipientAddress: contact.email,
                status: (i < result.sent ? 'sent' : 'failed') as import('@/types/database').CampaignRecipientStatus,
                sentAt: new Date().toISOString(),
            })))

        } else if (channel === 'sms') {
            const recipients = await this.contactRepo.findWithPhoneByOrgId(orgId, tags)
            if (recipients.length === 0) {
                return failure(new ValidationError('Nenhum contato com telefone encontrado'))
            }

            await this.campaignRepo.updateStatus(campaignId, orgId, 'sending')

            const messages = recipients.flatMap(contact => {
                const normalizedPhone = normalizeBrazilianPhone(contact.phone)
                if (!normalizedPhone) return []
                return [{ to: normalizedPhone, body: this.personalizeBodyPhone(campaign.body, contact) }]
            })

            result = await this.smsService.sendBatch(messages)

            await this.recipientRepo.bulkCreate(recipients.map((contact, i) => ({
                campaignId,
                organizationId: orgId,
                contactId: contact.id ?? null,
                contactName: contact.name,
                recipientAddress: contact.phone,
                status: (i < result.sent ? 'sent' : 'failed') as import('@/types/database').CampaignRecipientStatus,
                sentAt: new Date().toISOString(),
            })))

        } else if (channel === 'whatsapp') {
            const recipients = await this.contactRepo.findWithPhoneByOrgId(orgId, tags)
            if (recipients.length === 0) {
                return failure(new ValidationError('Nenhum contato com telefone encontrado'))
            }

            await this.campaignRepo.updateStatus(campaignId, orgId, 'sending')

            // Envio paralelo com concorrência limitada
            const recipientRows: import('@/domain/interfaces').CreateCampaignRecipientInput[] = []
            let sent = 0
            let failed = 0

            const sendOne = async (contact: typeof recipients[number]) => {
                const normalizedPhone = normalizeBrazilianPhone(contact.phone)
                if (!normalizedPhone) {
                    failed++
                    recipientRows.push({
                        campaignId,
                        organizationId: orgId,
                        contactId: contact.id ?? null,
                        contactName: contact.name,
                        recipientAddress: contact.phone,
                        status: 'failed',
                        errorMessage: `Telefone inválido ou fora do formato aceito: ${contact.phone}`,
                    })
                    return
                }
                const body = this.personalizeBodyPhone(campaign.body, contact)
                try {
                    const sendResult = await this.whatsAppService.send({ to: normalizedPhone, body })
                    sent++
                    recipientRows.push({
                        campaignId,
                        organizationId: orgId,
                        contactId: contact.id ?? null,
                        contactName: contact.name,
                        recipientAddress: contact.phone,
                        status: 'sent',
                        twilioSid: sendResult.sid,
                        sentAt: new Date().toISOString(),
                    })
                } catch (error) {
                    failed++
                    const errMsg = error instanceof Error ? error.message : 'Falha no envio'
                    console.error(`[SendCampaign] WhatsApp failed for ${contact.phone}:`, errMsg)
                    recipientRows.push({
                        campaignId,
                        organizationId: orgId,
                        contactId: contact.id ?? null,
                        contactName: contact.name,
                        recipientAddress: contact.phone,
                        status: 'failed',
                        errorMessage: errMsg,
                    })
                }
            }

            // Processar em lotes de WHATSAPP_CONCURRENCY
            for (let i = 0; i < recipients.length; i += WHATSAPP_CONCURRENCY) {
                const batch = recipients.slice(i, i + WHATSAPP_CONCURRENCY)
                await Promise.all(batch.map(sendOne))
            }

            // Persistir todos os destinatários de uma vez
            await this.recipientRepo.bulkCreate(recipientRows)
            result = { sent, failed }

        } else {
            return failure(new ValidationError(`Canal inválido: ${channel}`))
        }

        // Atualizar status e métricas da campanha
        const previousMetrics = resend ? campaign.metrics : null
        const metrics = {
            total_sent: (previousMetrics?.total_sent ?? 0) + result.sent,
            total_failed: result.failed,
            open_rate: previousMetrics?.open_rate ?? 0,
            click_rate: previousMetrics?.click_rate ?? 0,
            bounce_rate: 0,
        }

        await this.campaignRepo.updateStatus(campaignId, orgId, 'sent', metrics)

        // Deduzir créditos pelos envios realizados (best-effort)
        if (this.creditRepo && result.sent > 0) {
            try {
                const channel = campaign.channel || 'email'
                const cost = creditsForCampaign(
                    channel as 'whatsapp' | 'sms' | 'email',
                    result.sent,
                )
                if (cost > 0) {
                    await this.creditRepo.consume(
                        orgId,
                        cost,
                        channel === 'whatsapp' ? 'usage_whatsapp' : channel === 'sms' ? 'usage_sms' : 'usage_email',
                        `Campanha: ${campaign.name} (${result.sent} envios)`,
                        campaignId,
                    )
                }
            } catch {
                // Best-effort: não bloquear fluxo de campanha se dedução falhar
            }
        }

        return success(result)
    }

    private personalizeBody(body: string, contact: { name: string; email: string }): string {
        return body
            .replaceAll('{{nome}}', contact.name)
            .replaceAll('{{email}}', contact.email)
    }

    private personalizeBodyPhone(body: string, contact: { name: string; phone: string }): string {
        return body
            .replaceAll('{{nome}}', contact.name)
            .replaceAll('{{telefone}}', contact.phone)
    }
}

// --- Get Campaign Detail ---

export class GetCampaignUseCase {
    constructor(private readonly campaignRepo: ICampaignRepository) {}

    async execute(orgId: string, campaignId: string): Promise<Result<Campaign>> {
        const campaign = await this.campaignRepo.findById(campaignId)
        if (!campaign || campaign.organizationId !== orgId) {
            return failure(new EntityNotFoundError('Campanha'))
        }
        return success(campaign)
    }
}

export { GetCrmContextUseCase, type CrmContext } from './get-crm-context'

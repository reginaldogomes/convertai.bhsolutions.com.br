import { z } from 'zod'
import { type Result, success, failure, ValidationError, EntityNotFoundError } from '@/domain/errors'
import type { ICampaignRepository, IContactRepository, IEmailService, IWhatsAppService, ISmsService } from '@/domain/interfaces'
import { Campaign } from '@/domain/entities'

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

export class SendCampaignUseCase {
    constructor(
        private readonly campaignRepo: ICampaignRepository,
        private readonly contactRepo: IContactRepository,
        private readonly emailService: IEmailService,
        private readonly whatsAppService: IWhatsAppService,
        private readonly smsService: ISmsService,
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

        // 2. Determine channel (from campaign row or default to email)
        const channel = (campaign as unknown as { channel?: string }).channel || 'email'

        // 3. Get recipients based on channel
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
        } else if (channel === 'sms' || channel === 'whatsapp') {
            const recipients = await this.contactRepo.findWithPhoneByOrgId(orgId, tags)
            if (recipients.length === 0) {
                return failure(new ValidationError('Nenhum contato com telefone encontrado'))
            }

            await this.campaignRepo.updateStatus(campaignId, orgId, 'sending')

            const messages = recipients.map(contact => ({
                to: contact.phone,
                body: this.personalizeBodyPhone(campaign.body, contact),
            }))

            if (channel === 'sms') {
                result = await this.smsService.sendBatch(messages)
            } else {
                // WhatsApp — send one by one
                let sent = 0
                let failed = 0
                for (const msg of messages) {
                    try {
                        await this.whatsAppService.send(msg)
                        sent++
                    } catch (error) {
                        console.error('[SendCampaign] WhatsApp send failed:', error)
                        failed++
                    }
                }
                result = { sent, failed }
            }
        } else {
            return failure(new ValidationError(`Canal inválido: ${channel}`))
        }

        // Update campaign status and metrics
        const previousMetrics = resend ? campaign.metrics : null
        const metrics = {
            total_sent: (previousMetrics?.total_sent ?? 0) + result.sent,
            total_failed: result.failed,
            open_rate: previousMetrics?.open_rate ?? 0,
            click_rate: previousMetrics?.click_rate ?? 0,
            bounce_rate: 0,
        }

        await this.campaignRepo.updateStatus(campaignId, orgId, 'sent', metrics)

        return success(result)
    }

    private personalizeBody(
        body: string,
        contact: { name: string; email: string },
    ): string {
        return body
            .replaceAll('{{nome}}', contact.name)
            .replaceAll('{{email}}', contact.email)
    }

    private personalizeBodyPhone(
        body: string,
        contact: { name: string; phone: string },
    ): string {
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

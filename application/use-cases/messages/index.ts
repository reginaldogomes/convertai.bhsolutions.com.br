import { z } from 'zod'
import { type Result, success, failure, ValidationError } from '@/domain/errors'
import type { IMessageRepository, IContactRepository, IWhatsAppService, IEmailService, ISmsService } from '@/domain/interfaces'
import { Message, type MessageThread } from '@/domain/entities'

const sendMessageSchema = z.object({
    contactId: z.string().uuid(),
    content: z.string().min(1, 'Mensagem não pode ser vazia'),
    channel: z.enum(['whatsapp', 'email', 'sms']).default('whatsapp'),
    subject: z.string().optional(),
})

export class SendMessageUseCase {
    constructor(
        private readonly messageRepo: IMessageRepository,
        private readonly contactRepo: IContactRepository,
        private readonly whatsAppService: IWhatsAppService,
        private readonly emailService: IEmailService,
        private readonly smsService: ISmsService,
    ) {}

    async execute(orgId: string, input: {
        contactId: string
        content: string
        channel?: string
        subject?: string
    }): Promise<Result<Message>> {
        const parsed = sendMessageSchema.safeParse(input)
        if (!parsed.success) return failure(new ValidationError('Mensagem inválida'))

        const { contactId, content, channel, subject } = parsed.data
        const contact = await this.contactRepo.findById(contactId)

        if (channel === 'whatsapp') {
            if (!contact?.phone) {
                return failure(new ValidationError('Contato não possui número de telefone'))
            }
            await this.whatsAppService.send({ to: contact.phone, body: content })
        } else if (channel === 'sms') {
            if (!contact?.phone) {
                return failure(new ValidationError('Contato não possui número de telefone'))
            }
            await this.smsService.send({ to: contact.phone, body: content })
        } else if (channel === 'email') {
            if (!contact?.email) {
                return failure(new ValidationError('Contato não possui email cadastrado'))
            }
            await this.emailService.send({
                to: contact.email,
                subject: subject || 'Mensagem',
                html: content,
            })
        }

        // Persist in database
        const message = await this.messageRepo.create({
            organizationId: orgId,
            contactId,
            channel,
            content,
            direction: 'outbound',
        })

        if (!message) return failure(new ValidationError('Erro ao salvar mensagem'))
        return success(message)
    }
}

export class ListThreadsUseCase {
    constructor(private readonly messageRepo: IMessageRepository) {}

    async execute(orgId: string): Promise<MessageThread[]> {
        const rawMessages = await this.messageRepo.findByOrgId(orgId)

        const threads: MessageThread[] = []
        const threadMap = new Map<string, MessageThread>()

        for (const msg of rawMessages) {
            const contact = msg.contacts
            if (!contact) continue

            const existing = threadMap.get(msg.contact_id)
            if (existing) {
                existing.messages.push(Message.fromRow(msg))
            } else {
                const thread: MessageThread = {
                    contact,
                    messages: [Message.fromRow(msg)],
                    lastActivity: msg.created_at,
                }
                threadMap.set(msg.contact_id, thread)
                threads.push(thread)
            }
        }

        return threads
    }
}

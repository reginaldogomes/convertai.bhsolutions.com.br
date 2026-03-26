import type { IMessageRepository, IContactRepository } from '@/domain/interfaces'
import type { Message } from '@/domain/entities'

export interface HandleInboundInput {
    from: string            // E.164 phone number
    body: string
    messageSid: string
    channel: 'whatsapp' | 'email'
}

export interface HandleInboundResult {
    message: Message
    contactCreated: boolean
}

export class HandleInboundMessageUseCase {
    constructor(
        private readonly messageRepo: IMessageRepository,
        private readonly contactRepo: IContactRepository,
        private readonly orgId: string,
    ) {}

    async execute(input: HandleInboundInput): Promise<HandleInboundResult | null> {
        const phone = input.from.replace('whatsapp:', '')

        // Find existing contact by phone
        let contact = await this.contactRepo.findByPhone(phone, this.orgId)
        let contactCreated = false

        // Auto-create contact if unknown number
        if (!contact) {
            contact = await this.contactRepo.create({
                organizationId: this.orgId,
                name: `WhatsApp ${phone}`,
                email: null,
                phone,
                company: null,
                tags: ['whatsapp', 'auto-created'],
                notes: null,
            })
            contactCreated = true
        }

        if (!contact) return null

        // Persist inbound message
        const message = await this.messageRepo.create({
            organizationId: this.orgId,
            contactId: contact.id,
            channel: input.channel,
            content: input.body,
            direction: 'inbound',
        })

        if (!message) return null
        return { message, contactCreated }
    }
}

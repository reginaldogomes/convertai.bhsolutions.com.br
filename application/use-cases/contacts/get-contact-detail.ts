import type { IContactRepository } from '@/domain/interfaces'
import type { IMessageRepository } from '@/domain/interfaces'
import type { IDealRepository } from '@/domain/interfaces'
import type { Contact, Deal } from '@/domain/entities'
import type { Message } from '@/domain/entities'

export interface ContactDetail {
    contact: Contact
    messages: Message[]
    deals: Deal[]
}

export class GetContactDetailUseCase {
    constructor(
        private readonly contactRepo: IContactRepository,
        private readonly messageRepo: IMessageRepository,
        private readonly dealRepo: IDealRepository,
    ) {}

    async execute(contactId: string, orgId: string): Promise<ContactDetail | null> {
        const contact = await this.contactRepo.findById(contactId)
        if (!contact || !contact.belongsToOrg(orgId)) return null

        const [messages, deals] = await Promise.all([
            this.messageRepo.findByContactId(contactId, 10),
            this.dealRepo.findByContactId(contactId),
        ])

        return { contact, messages, deals }
    }
}

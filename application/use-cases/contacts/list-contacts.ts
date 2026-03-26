import type { IContactRepository } from '@/domain/interfaces'
import type { Contact } from '@/domain/entities'

export class ListContactsUseCase {
    constructor(private readonly contactRepo: IContactRepository) {}

    async execute(orgId: string): Promise<Contact[]> {
        return this.contactRepo.findByOrgId(orgId)
    }
}

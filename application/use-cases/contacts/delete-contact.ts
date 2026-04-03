import { type Result, success, failure, EntityNotFoundError } from '@/domain/errors'
import type { IContactRepository } from '@/domain/interfaces'

export class DeleteContactUseCase {
    constructor(private readonly contactRepo: IContactRepository) {}

    async execute(orgId: string, contactId: string): Promise<Result<boolean>> {
        const contact = await this.contactRepo.findById(contactId)
        if (!contact || contact.organizationId !== orgId) {
            return failure(new EntityNotFoundError('Contato'))
        }
        await this.contactRepo.delete(contactId, orgId)
        return success(true)
    }
}

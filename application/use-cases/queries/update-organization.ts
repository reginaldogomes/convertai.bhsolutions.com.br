import { type Result, success, failure, ValidationError } from '@/domain/errors'
import type { IUserRepository, OrganizationDetails } from '@/domain/interfaces'

export class UpdateOrganizationUseCase {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(orgId: string, input: Partial<Omit<OrganizationDetails, 'orgId'>>): Promise<Result<boolean>> {
        if (input.orgName !== undefined && input.orgName.trim().length === 0) {
            return failure(new ValidationError('Nome da organização é obrigatório'))
        }
        await this.userRepo.updateOrganization(orgId, input)
        return success(true)
    }
}

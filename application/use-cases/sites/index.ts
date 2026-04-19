import type { ISiteRepository, CreateSiteInput } from '@/domain/interfaces'
import { DomainError } from '@/domain/errors'
import type { Site } from '@/domain/entities/site'

export class ListSitesUseCase {
    constructor(private readonly siteRepo: ISiteRepository) {}

    async execute(orgId: string): Promise<Site[]> {
        return this.siteRepo.listByOrg(orgId)
    }
}

export class CreateSiteUseCase {
    constructor(private readonly siteRepo: ISiteRepository) {}

    async execute(orgId: string, input: CreateSiteInput): Promise<Site> {
        if (!input.name || input.name.trim().length === 0) {
            throw new DomainError('VALIDATION_ERROR', 'O nome do site é obrigatório.')
        }
        return this.siteRepo.create(orgId, { name: input.name.trim() })
    }
}

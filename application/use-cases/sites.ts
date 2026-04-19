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
        // A validação principal (min/max length, etc.) é feita com Zod na Server Action,
        // que é a porta de entrada para a aplicação a partir da UI.
        // Mantemos uma verificação básica para garantir que o nome não seja vazio.
        if (!input.name || input.name.trim().length === 0) {
            throw new DomainError('VALIDATION_ERROR', 'O nome do site é obrigatório.')
        }

        const existingSites = await this.siteRepo.listByOrg(orgId)
        if (existingSites.length > 0) {
            throw new DomainError('LIMIT_EXCEEDED', 'Sua organização já possui um site. Apenas um site é permitido.')
        }

        return this.siteRepo.create(orgId, { name: input.name.trim() })
    }
}
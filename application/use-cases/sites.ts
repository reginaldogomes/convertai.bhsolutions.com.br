import type { ISiteRepository, CreateSiteInput, UpdateSiteInput } from '@/domain/interfaces'
import { DomainError } from '@/domain/errors'
import type { Site } from '@/domain/entities/site'

export class ListSitesUseCase {
    constructor(private readonly siteRepo: ISiteRepository) {}

    async execute(orgId: string): Promise<Site[]> {
        return this.siteRepo.listByOrg(orgId)
    }
}

export class GetSiteDetailUseCase {
    constructor(private readonly siteRepo: ISiteRepository) {}

    async execute(orgId: string, siteId: string): Promise<Site> {
        const site = await this.siteRepo.getById(siteId, orgId)
        if (!site) {
            throw new DomainError('NOT_FOUND', 'Site não encontrado ou você não tem permissão para acessá-lo.')
        }
        return site
    }
}

export class CreateSiteUseCase {
    constructor(private readonly siteRepo: ISiteRepository) {}

    async execute(orgId: string, input: CreateSiteInput): Promise<Site> {
        if (!input.name || input.name.trim().length === 0) {
            throw new DomainError('VALIDATION_ERROR', 'O nome do site é obrigatório.')
        }

        const existingSites = await this.siteRepo.listByOrg(orgId)
        if (existingSites.length > 0) {
            throw new DomainError(
                'SITE_LIMIT_EXCEEDED',
                'Sua organização já possui um site ativo. Cada organização pode ter apenas um site. Para criar um novo site, primeiro exclua o site atual.'
            )
        }

        return this.siteRepo.create(orgId, { name: input.name.trim() })
    }
}

export class UpdateSiteUseCase {
    constructor(private readonly siteRepo: ISiteRepository) {}

    async execute(orgId: string, siteId: string, input: UpdateSiteInput): Promise<Site> {
        const site = await this.siteRepo.getById(siteId, orgId)
        if (!site) {
            throw new DomainError('NOT_FOUND', 'Site não encontrado ou você não tem permissão para acessá-lo.')
        }

        if (input.name !== undefined) {
            if (!input.name || input.name.trim().length === 0) {
                throw new DomainError('VALIDATION_ERROR', 'O nome do site é obrigatório.')
            }
            if (input.name.trim().length < 3) {
                throw new DomainError('VALIDATION_ERROR', 'O nome do site deve ter pelo menos 3 caracteres.')
            }
            if (input.name.trim().length > 50) {
                throw new DomainError('VALIDATION_ERROR', 'O nome do site não pode ter mais de 50 caracteres.')
            }
        }

        return this.siteRepo.update(siteId, orgId, {
            name: input.name?.trim(),
        })
    }
}

export class DeleteSiteUseCase {
    constructor(private readonly siteRepo: ISiteRepository) {}

    async execute(orgId: string, siteId: string): Promise<void> {
        const site = await this.siteRepo.getById(siteId, orgId)
        if (!site) {
            throw new DomainError('NOT_FOUND', 'Site não encontrado ou você não tem permissão para acessá-lo.')
        }

        await this.siteRepo.delete(siteId, orgId)
    }
}
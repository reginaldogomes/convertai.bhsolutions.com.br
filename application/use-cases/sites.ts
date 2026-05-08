import type { ISiteRepository, CreateSiteInput, UpdateSiteInput } from '@/domain/interfaces'
import { DomainError } from '@/domain/errors'
import type { Site } from '@/domain/entities/site'

function toSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 60)
}

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

export class GetSiteBySlugUseCase {
    constructor(private readonly siteRepo: ISiteRepository) {}

    async execute(slug: string): Promise<Site | null> {
        return this.siteRepo.findBySlug(slug)
    }
}

export class CreateSiteUseCase {
    constructor(private readonly siteRepo: ISiteRepository) {}

    async execute(orgId: string, input: CreateSiteInput): Promise<Site> {
        if (!input.name || input.name.trim().length === 0) {
            throw new DomainError('VALIDATION_ERROR', 'O nome do site é obrigatório.')
        }

        // All plans allow exactly 1 site per organization (max_sites = 1).
        const existingSites = await this.siteRepo.listByOrg(orgId)
        if (existingSites.length > 0) {
            throw new DomainError(
                'SITE_LIMIT_EXCEEDED',
                'Cada organização pode ter apenas 1 site ativo (limite do plano). Para criar um novo site, exclua o atual ou crie uma nova organização.'
            )
        }

        // Generate slug if not provided
        const slug = input.slug || toSlug(input.name.trim())

        return this.siteRepo.create(orgId, {
            ...input,
            name: input.name.trim(),
            slug,
        })
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
            ...input,
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

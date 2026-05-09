import type { Site } from '@/domain/entities/site'

export interface CreateSiteInput {
    name: string
    slug: string
    configJson?: Record<string, any>
    primaryColor?: string | null
    logoUrl?: string | null
    description?: string | null
    theme?: string | null
    status?: string | null
}

export interface UpdateSiteInput {
    name?: string
    slug?: string
    configJson?: Record<string, any>
    primaryColor?: string | null
    logoUrl?: string | null
    description?: string | null
    theme?: string | null
    status?: string | null
}

export interface ISiteRepository {
    listByOrg(orgId: string): Promise<Site[]>
    getById(id: string, orgId: string): Promise<Site | null>
    findBySlug(slug: string): Promise<Site | null>
    create(orgId: string, input: CreateSiteInput): Promise<Site>
    update(id: string, orgId: string, input: UpdateSiteInput): Promise<Site>
    delete(id: string, orgId: string): Promise<void>
}

import type { Site } from '@/domain/entities/site'

export interface CreateSiteInput {
    name: string
}

export interface UpdateSiteInput {
    name?: string
}

export interface ISiteRepository {
    listByOrg(orgId: string): Promise<Site[]>
    getById(id: string, orgId: string): Promise<Site | null>
    create(orgId: string, input: CreateSiteInput): Promise<Site>
    update(id: string, orgId: string, input: UpdateSiteInput): Promise<Site>
    delete(id: string, orgId: string): Promise<void>
}

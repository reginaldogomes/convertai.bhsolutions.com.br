import type { Site } from '@/domain/entities/site'

export interface CreateSiteInput {
    name: string
}

export interface ISiteRepository {
    listByOrg(orgId: string): Promise<Site[]>
    create(orgId: string, input: CreateSiteInput): Promise<Site>
}

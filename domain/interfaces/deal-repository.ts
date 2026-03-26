import type { Deal } from '@/domain/entities'
import type { PipelineStage } from '@/types/database'

export interface CreateDealInput {
    organizationId: string
    contactId: string
    title: string
    pipelineStage: PipelineStage
    value: number
}

export interface IDealRepository {
    findByOrgId(orgId: string): Promise<Deal[]>
    findByContactId(contactId: string): Promise<Deal[]>
    create(input: CreateDealInput): Promise<Deal | null>
    updateStage(dealId: string, stage: PipelineStage, orgId: string): Promise<boolean>
    getStatsForOrg(orgId: string): Promise<{ total: number; won: number }>
}

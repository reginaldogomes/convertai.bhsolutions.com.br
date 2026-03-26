import type { Campaign } from '@/domain/entities'
import type { CampaignStatus } from '@/types/database'

export interface CampaignRow {
    id: string
    organization_id: string
    name: string
    subject: string
    body: string
    status: string
    sent_at: string | null
    metrics: unknown
    created_at: string
}

export interface CreateCampaignInput {
    organizationId: string
    name: string
    subject: string
    body: string
}

export interface UpdateCampaignInput {
    name?: string
    subject?: string
    body?: string
}

export interface ICampaignRepository {
    findById(id: string): Promise<Campaign | null>
    findByOrgId(orgId: string): Promise<CampaignRow[]>
    create(input: CreateCampaignInput): Promise<Campaign | null>
    update(id: string, orgId: string, input: UpdateCampaignInput): Promise<Campaign | null>
    updateStatus(id: string, orgId: string, status: CampaignStatus, metrics?: Record<string, number>): Promise<boolean>
    countSentByOrgId(orgId: string): Promise<number>
}

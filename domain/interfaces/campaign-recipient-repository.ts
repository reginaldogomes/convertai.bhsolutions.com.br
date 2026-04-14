import type { CampaignRecipient } from '@/domain/entities'
import type { CampaignRecipientStatus } from '@/types/database'

export interface CreateCampaignRecipientInput {
    campaignId: string
    organizationId: string
    contactId: string | null
    contactName: string
    recipientAddress: string
    status?: CampaignRecipientStatus
    twilioSid?: string | null
    errorMessage?: string | null
    sentAt?: string | null
}

export interface ICampaignRecipientRepository {
    bulkCreate(recipients: CreateCampaignRecipientInput[]): Promise<void>
    updateByTwilioSid(twilioSid: string, status: CampaignRecipientStatus, extra?: {
        deliveredAt?: string
        readAt?: string
        errorMessage?: string
    }): Promise<boolean>
    findByCampaignId(campaignId: string, orgId: string): Promise<CampaignRecipient[]>
    countByCampaignAndStatus(campaignId: string, orgId: string): Promise<Record<CampaignRecipientStatus, number>>
}

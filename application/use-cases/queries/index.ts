import type { IContactRepository, ICampaignRepository, IDealRepository, IUserRepository, CampaignRow, ICampaignRecipientRepository } from '@/domain/interfaces'
import type { Contact, Deal, Campaign, CampaignRecipient } from '@/domain/entities'
import type { UserProfile, OrganizationDetails } from '@/domain/interfaces'
import type { CampaignRecipientStatus } from '@/types/database'

// --- List Campaigns (for page) ---

export class ListCampaignsUseCase {
    constructor(private readonly campaignRepo: ICampaignRepository) {}

    async execute(orgId: string): Promise<CampaignRow[]> {
        return this.campaignRepo.findByOrgId(orgId)
    }
}

// --- List Contact Selects (id+name for deal forms) ---

export class ListContactSelectsUseCase {
    constructor(private readonly contactRepo: IContactRepository) {}

    async execute(orgId: string): Promise<{ id: string; name: string }[]> {
        return this.contactRepo.findIdAndNameByOrgId(orgId)
    }
}

// --- Get User Settings (profile + org) ---

export class GetUserSettingsUseCase {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(userId: string): Promise<(UserProfile & OrganizationDetails) | null> {
        return this.userRepo.findProfileWithOrgByUserId(userId)
    }
}

// --- List Recipients (contacts with email) ---

export class ListRecipientsUseCase {
    constructor(private readonly contactRepo: IContactRepository) {}

    async execute(orgId: string, tags?: string[]): Promise<{ id: string; name: string; email: string }[]> {
        return this.contactRepo.findWithEmailByOrgId(orgId, tags)
    }
}

export { UpdateOrganizationUseCase } from './update-organization'

// --- Get Campaign Recipients ---

export class GetCampaignRecipientsUseCase {
    constructor(private readonly recipientRepo: ICampaignRecipientRepository) {}

    async execute(orgId: string, campaignId: string): Promise<CampaignRecipient[]> {
        return this.recipientRepo.findByCampaignId(campaignId, orgId)
    }

    async countByStatus(orgId: string, campaignId: string): Promise<Record<CampaignRecipientStatus, number>> {
        return this.recipientRepo.countByCampaignAndStatus(campaignId, orgId)
    }
}

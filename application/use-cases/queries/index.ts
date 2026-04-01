import type { IContactRepository, ICampaignRepository, IDealRepository, IUserRepository, CampaignRow } from '@/domain/interfaces'
import type { Contact, Deal, Campaign } from '@/domain/entities'
import type { UserProfile, OrganizationDetails } from '@/domain/interfaces'

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

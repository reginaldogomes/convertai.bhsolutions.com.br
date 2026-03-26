import type { IContactRepository, IDealRepository, IMessageRepository, ICampaignRepository } from '@/domain/interfaces'

export interface DashboardStats {
    newLeads: number
    openConversations: number
    campaignsSent: number
    conversionRate: number
}

const EMPTY_STATS: DashboardStats = { newLeads: 0, openConversations: 0, campaignsSent: 0, conversionRate: 0 }

export class GetDashboardStatsUseCase {
    constructor(
        private readonly contactRepo: IContactRepository,
        private readonly messageRepo: IMessageRepository,
        private readonly campaignRepo: ICampaignRepository,
        private readonly dealRepo: IDealRepository,
    ) {}

    async execute(orgId: string): Promise<DashboardStats> {
        try {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

            const [newLeads, openConversations, campaignsSent, dealStats] = await Promise.allSettled([
                this.contactRepo.countRecentByOrgId(orgId, sevenDaysAgo),
                this.messageRepo.countInboundByOrgId(orgId),
                this.campaignRepo.countSentByOrgId(orgId),
                this.dealRepo.getStatsForOrg(orgId),
            ])

            const stats = dealStats.status === 'fulfilled' ? dealStats.value : { total: 0, won: 0 }

            return {
                newLeads: newLeads.status === 'fulfilled' ? newLeads.value : 0,
                openConversations: openConversations.status === 'fulfilled' ? openConversations.value : 0,
                campaignsSent: campaignsSent.status === 'fulfilled' ? campaignsSent.value : 0,
                conversionRate: stats.total > 0 ? Math.round((stats.won / stats.total) * 100) : 0,
            }
        } catch {
            return EMPTY_STATS
        }
    }
}

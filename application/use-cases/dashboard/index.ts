import type {
    IContactRepository, IDealRepository, IMessageRepository, ICampaignRepository,
    ILandingPageRepository, IAutomationRepository, IInstagramContentRepository, IAnalyticsRepository,
} from '@/domain/interfaces'

export interface DashboardStats {
    newLeads: number
    openConversations: number
    campaignsSent: number
    conversionRate: number
    totalContacts: number
    totalDeals: number
    dealsWon: number
    landingPages: number
    landingPagesPublished: number
    landingPageViews: number
    landingPageLeads: number
    automationsTotal: number
    automationsActive: number
    instagramContents: number
}

const EMPTY_STATS: DashboardStats = {
    newLeads: 0, openConversations: 0, campaignsSent: 0, conversionRate: 0,
    totalContacts: 0, totalDeals: 0, dealsWon: 0,
    landingPages: 0, landingPagesPublished: 0, landingPageViews: 0, landingPageLeads: 0,
    automationsTotal: 0, automationsActive: 0, instagramContents: 0,
}

export class GetDashboardStatsUseCase {
    constructor(
        private readonly contactRepo: IContactRepository,
        private readonly messageRepo: IMessageRepository,
        private readonly campaignRepo: ICampaignRepository,
        private readonly dealRepo: IDealRepository,
        private readonly landingPageRepo: ILandingPageRepository,
        private readonly automationRepo: IAutomationRepository,
        private readonly instagramContentRepo: IInstagramContentRepository,
        private readonly analyticsRepo: IAnalyticsRepository,
    ) {}

    async execute(orgId: string): Promise<DashboardStats> {
        try {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

            const [
                newLeads, openConversations, campaignsSent, dealStats,
                contacts, landingPages, automations, instagramCount, lpAnalytics,
            ] = await Promise.allSettled([
                this.contactRepo.countRecentByOrgId(orgId, sevenDaysAgo),
                this.messageRepo.countInboundByOrgId(orgId),
                this.campaignRepo.countSentByOrgId(orgId),
                this.dealRepo.getStatsForOrg(orgId),
                this.contactRepo.findByOrgId(orgId),
                this.landingPageRepo.findByOrgId(orgId),
                this.automationRepo.findByOrgId(orgId),
                this.instagramContentRepo.countByOrgId(orgId),
                this.analyticsRepo.getSummaryByOrg(orgId),
            ])

            const deals = dealStats.status === 'fulfilled' ? dealStats.value : { total: 0, won: 0 }
            const contactList = contacts.status === 'fulfilled' ? contacts.value : []
            const pages = landingPages.status === 'fulfilled' ? landingPages.value : []
            const autos = automations.status === 'fulfilled' ? automations.value : []
            const analytics = lpAnalytics.status === 'fulfilled' ? lpAnalytics.value : { totalViews: 0, totalLeads: 0 }

            return {
                newLeads: newLeads.status === 'fulfilled' ? newLeads.value : 0,
                openConversations: openConversations.status === 'fulfilled' ? openConversations.value : 0,
                campaignsSent: campaignsSent.status === 'fulfilled' ? campaignsSent.value : 0,
                conversionRate: deals.total > 0 ? Math.round((deals.won / deals.total) * 100) : 0,
                totalContacts: contactList.length,
                totalDeals: deals.total,
                dealsWon: deals.won,
                landingPages: pages.length,
                landingPagesPublished: pages.filter(p => p.isPublished()).length,
                landingPageViews: analytics.totalViews,
                landingPageLeads: analytics.totalLeads,
                automationsTotal: autos.length,
                automationsActive: autos.filter(a => a.isActive()).length,
                instagramContents: instagramCount.status === 'fulfilled' ? instagramCount.value : 0,
            }
        } catch {
            return EMPTY_STATS
        }
    }
}

import type { IContactRepository, ICampaignRepository, IDealRepository, IUserRepository } from '@/domain/interfaces'

export interface CrmContext {
    orgName: string
    contactCount: number
    allTags: string[]
    companies: string[]
    stageDistribution: Record<string, number>
    pastCampaigns: { name: string; subject: string; openRate: number; clickRate: number }[]
}

export class GetCrmContextUseCase {
    constructor(
        private readonly contactRepo: IContactRepository,
        private readonly dealRepo: IDealRepository,
        private readonly campaignRepo: ICampaignRepository,
        private readonly userRepo: IUserRepository,
    ) {}

    async execute(orgId: string, userId: string): Promise<CrmContext> {
        const [contacts, deals, campaignRows, profile] = await Promise.all([
            this.contactRepo.findByOrgId(orgId),
            this.dealRepo.findByOrgId(orgId),
            this.campaignRepo.findByOrgId(orgId),
            this.userRepo.findProfileWithOrgByUserId(userId),
        ])

        const allTags = [...new Set(contacts.flatMap(c => c.tags ?? []))]
        const companies = [...new Set(contacts.map(c => c.company).filter((c): c is string => Boolean(c)))]

        const stageDistribution = deals.reduce<Record<string, number>>((acc, d) => {
            acc[d.pipelineStage] = (acc[d.pipelineStage] ?? 0) + 1
            return acc
        }, {})

        const sentCampaigns = campaignRows
            .filter(c => c.status === 'sent')
            .slice(0, 5)

        const pastCampaigns = sentCampaigns.map(c => {
            const metrics = c.metrics as Record<string, number> | null
            return {
                name: c.name,
                subject: c.subject,
                openRate: metrics?.open_rate ?? 0,
                clickRate: metrics?.click_rate ?? 0,
            }
        })

        return {
            orgName: profile?.orgName ?? 'Empresa',
            contactCount: contacts.length,
            allTags: allTags.slice(0, 15),
            companies: companies.slice(0, 10),
            stageDistribution,
            pastCampaigns,
        }
    }
}

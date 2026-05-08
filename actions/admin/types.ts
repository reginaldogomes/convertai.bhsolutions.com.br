export interface OrgSummary {
    id: string
    name: string
    created_at: string
    user_count: number
    landing_page_count: number
}

export interface OrgDetail {
    id: string
    name: string
    created_at: string
}

export interface AdminUserRow {
    id: string
    name: string
    email: string
    role: string
    created_at: string
    org_id: string
    org_name: string
}

export interface AdminLandingPageRow {
    id: string
    name: string
    slug: string
    status: string
    created_at: string
    org_id: string
    org_name: string
}

export interface AdminStats {
    total_orgs: number
    total_users: number
    total_landing_pages: number
    mrr_brl: number
    active_subscriptions: number
    total_credits_balance: number
}

export interface OrgAdminData {
    subscription: {
        planId: string
        planName: string
        priceBrl: number
        status: string
        currentPeriodEnd: string
    } | null
    creditsBalance: number
}

export interface SuperAdminUser {
    id: string
    email: string
    name: string
    createdAt: string
}

export interface CostBreakdownItem {
    operation: string
    creditCharged: number
    creditValueBrl: number
    realCostBrl: number
    marginPercent: number
}

export interface PlatformCostAnalysis {
    totalAiCostCents: number
    totalCreditConsumed: number
    totalCreditConsumedByType: Record<string, number>
    plans: Array<{
        id: string
        name: string
        priceBrl: number
        monthlyCredits: number
        costPerCreditBrl: number
        estimatedApiCostPerCredit: number
        marginPercent: number
    }>
    costBreakdown: CostBreakdownItem[]
    markupPercent: number
}

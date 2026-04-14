import type { PlanId, SubscriptionStatus } from '@/types/database'

export interface PlanProps {
    id: PlanId
    name: string
    description: string
    priceBrl: number
    monthlyCredits: number
    maxContacts: number        // -1 = unlimited
    maxLandingPages: number
    maxUsers: number
    maxAutomations: number
    features: string[]
    isActive: boolean
    sortOrder: number
}

export class Plan {
    constructor(public readonly props: PlanProps) {}

    get id() { return this.props.id }
    get name() { return this.props.name }
    get description() { return this.props.description }
    get priceBrl() { return this.props.priceBrl }
    get monthlyCredits() { return this.props.monthlyCredits }
    get maxContacts() { return this.props.maxContacts }
    get maxLandingPages() { return this.props.maxLandingPages }
    get maxUsers() { return this.props.maxUsers }
    get maxAutomations() { return this.props.maxAutomations }
    get features() { return this.props.features }
    get isActive() { return this.props.isActive }

    isUnlimited(field: 'contacts' | 'landingPages' | 'users' | 'automations'): boolean {
        const map = {
            contacts: this.props.maxContacts,
            landingPages: this.props.maxLandingPages,
            users: this.props.maxUsers,
            automations: this.props.maxAutomations,
        }
        return map[field] === -1
    }

    formattedPrice(): string {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(this.priceBrl)
    }

    static fromRow(row: {
        id: PlanId
        name: string
        description: string
        price_brl: number
        monthly_credits: number
        max_contacts: number
        max_landing_pages: number
        max_users: number
        max_automations: number
        features: string[]
        is_active: boolean
        sort_order: number
    }): Plan {
        return new Plan({
            id: row.id,
            name: row.name,
            description: row.description,
            priceBrl: row.price_brl,
            monthlyCredits: row.monthly_credits,
            maxContacts: row.max_contacts,
            maxLandingPages: row.max_landing_pages,
            maxUsers: row.max_users,
            maxAutomations: row.max_automations,
            features: row.features ?? [],
            isActive: row.is_active,
            sortOrder: row.sort_order,
        })
    }
}

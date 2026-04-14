import type { PlanId, SubscriptionStatus, CreditTransactionType } from '@/types/database'

export interface SubscriptionProps {
    id: string
    organizationId: string
    planId: PlanId
    planName: string
    status: SubscriptionStatus
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    notes: string | null
    creditsBalance: number
    monthlyCredits: number
    createdAt: string
    updatedAt: string
}

export interface CreditPackProps {
    id: string
    name: string
    credits: number
    priceBrl: number
    isActive: boolean
    sortOrder: number
}

export interface CreditTransactionProps {
    id: string
    organizationId: string
    amount: number
    type: CreditTransactionType
    description: string
    referenceId: string | null
    balanceAfter: number
    createdAt: string
}

export class Subscription {
    constructor(public readonly props: SubscriptionProps) {}

    get id() { return this.props.id }
    get organizationId() { return this.props.organizationId }
    get planId() { return this.props.planId }
    get planName() { return this.props.planName }
    get status() { return this.props.status }
    get currentPeriodStart() { return this.props.currentPeriodStart }
    get currentPeriodEnd() { return this.props.currentPeriodEnd }
    get cancelAtPeriodEnd() { return this.props.cancelAtPeriodEnd }
    get notes() { return this.props.notes }
    get creditsBalance() { return this.props.creditsBalance }
    get monthlyCredits() { return this.props.monthlyCredits }

    isActive(): boolean { return this.props.status === 'active' || this.props.status === 'trialing' }
    isPastDue(): boolean { return this.props.status === 'past_due' }
    isCanceled(): boolean { return this.props.status === 'canceled' }

    creditsPercent(): number {
        if (this.monthlyCredits === 0) return 0
        return Math.min(100, Math.round((this.creditsBalance / this.monthlyCredits) * 100))
    }

    statusLabel(): string {
        const labels: Record<SubscriptionStatus, string> = {
            active: 'Ativo',
            trialing: 'Em teste',
            past_due: 'Pagamento pendente',
            canceled: 'Cancelado',
        }
        return labels[this.props.status] ?? this.props.status
    }

    daysUntilRenewal(): number {
        const end = new Date(this.props.currentPeriodEnd)
        const now = new Date()
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return Math.max(0, diff)
    }
}

export class CreditPack {
    constructor(public readonly props: CreditPackProps) {}

    get id() { return this.props.id }
    get name() { return this.props.name }
    get credits() { return this.props.credits }
    get priceBrl() { return this.props.priceBrl }
    get isActive() { return this.props.isActive }

    formattedPrice(): string {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(this.priceBrl)
    }

    costPerCredit(): string {
        const cost = this.priceBrl / this.credits
        return (cost * 100).toFixed(1) + 'c/crédito'
    }

    static fromRow(row: {
        id: string
        name: string
        credits: number
        price_brl: number
        is_active: boolean
        sort_order: number
    }): CreditPack {
        return new CreditPack({
            id: row.id,
            name: row.name,
            credits: row.credits,
            priceBrl: row.price_brl,
            isActive: row.is_active,
            sortOrder: row.sort_order,
        })
    }
}

export class CreditTransaction {
    constructor(public readonly props: CreditTransactionProps) {}

    get id() { return this.props.id }
    get amount() { return this.props.amount }
    get type() { return this.props.type }
    get description() { return this.props.description }
    get balanceAfter() { return this.props.balanceAfter }
    get createdAt() { return this.props.createdAt }

    isCredit(): boolean { return this.props.amount > 0 }
    isDebit(): boolean { return this.props.amount < 0 }

    typeLabel(): string {
        const labels: Record<CreditTransactionType, string> = {
            plan_renewal: 'Renovação do plano',
            purchase: 'Compra de créditos',
            usage_ai: 'Uso IA',
            usage_whatsapp: 'Envio WhatsApp',
            usage_sms: 'Envio SMS',
            usage_email: 'Envio Email',
            admin_grant: 'Créditos concedidos',
            admin_deduct: 'Dedução manual',
            refund: 'Estorno',
        }
        return labels[this.props.type] ?? this.props.type
    }

    static fromRow(row: {
        id: string
        organization_id: string
        amount: number
        type: CreditTransactionType
        description: string
        reference_id: string | null
        balance_after: number
        created_at: string
    }): CreditTransaction {
        return new CreditTransaction({
            id: row.id,
            organizationId: row.organization_id,
            amount: row.amount,
            type: row.type,
            description: row.description,
            referenceId: row.reference_id,
            balanceAfter: row.balance_after,
            createdAt: row.created_at,
        })
    }
}

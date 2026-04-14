import type { Subscription, CreditPack, CreditTransaction } from '@/domain/entities/subscription'
import type { PlanId, SubscriptionStatus, CreditTransactionType } from '@/types/database'

export interface CreateSubscriptionInput {
    organizationId: string
    planId: PlanId
    status?: SubscriptionStatus
    notes?: string
}

export interface UpdateSubscriptionInput {
    planId?: PlanId
    status?: SubscriptionStatus
    cancelAtPeriodEnd?: boolean
    notes?: string
}

export interface ISubscriptionRepository {
    findByOrgId(orgId: string): Promise<Subscription | null>
    upsert(input: CreateSubscriptionInput): Promise<Subscription>
    update(orgId: string, input: UpdateSubscriptionInput): Promise<Subscription | null>
    listAllWithOrgInfo(): Promise<Array<{
        orgId: string
        orgName: string
        planId: PlanId
        planName: string
        status: SubscriptionStatus
        creditsBalance: number
        currentPeriodEnd: string
    }>>
}

export interface ICreditRepository {
    getBalance(orgId: string): Promise<number>
    consume(orgId: string, amount: number, type: CreditTransactionType, description: string, referenceId?: string, createdBy?: string): Promise<boolean>
    add(orgId: string, amount: number, type: CreditTransactionType, description: string, referenceId?: string, createdBy?: string): Promise<number>
    listTransactions(orgId: string, limit?: number): Promise<CreditTransaction[]>
    listPacks(): Promise<CreditPack[]>
}

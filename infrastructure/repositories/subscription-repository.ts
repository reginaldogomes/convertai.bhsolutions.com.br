import { createAdminClient } from '@/lib/supabase/admin'
import { Subscription, CreditPack, CreditTransaction } from '@/domain/entities'
import type { ISubscriptionRepository, ICreditRepository, CreateSubscriptionInput, UpdateSubscriptionInput } from '@/domain/interfaces'
import type { PlanId, SubscriptionStatus, CreditTransactionType } from '@/types/database'

export class SupabaseSubscriptionRepository implements ISubscriptionRepository {
    async findByOrgId(orgId: string): Promise<Subscription | null> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('organization_subscriptions')
            .select(`
                id, organization_id, plan_id, status,
                current_period_start, current_period_end, cancel_at_period_end, notes, created_at, updated_at,
                plans ( name, monthly_credits )
            `)
            .eq('organization_id', orgId)
            .single()
        if (error) {
            if (error.code === 'PGRST116') return null
            throw error
        }
        if (!data) return null

        const orgCredits = await supabase
            .from('organizations')
            .select('credits_balance')
            .eq('id', orgId)
            .single()

        return Subscription.fromRow({
            ...data,
            credits_balance: orgCredits.data?.credits_balance ?? 0,
            plan_name: (data.plans as { name: string; monthly_credits: number } | null)?.name ?? '',
            monthly_credits: (data.plans as { name: string; monthly_credits: number } | null)?.monthly_credits ?? 0,
        })
    }

    async upsert(input: CreateSubscriptionInput): Promise<Subscription> {
        const supabase = createAdminClient()
        const plan = await supabase
            .from('plans')
            .select('monthly_credits')
            .eq('id', input.planId)
            .single()
        if (plan.error) throw plan.error

        const now = new Date()
        const periodEnd = new Date(now)
        periodEnd.setMonth(periodEnd.getMonth() + 1)

        const { data, error } = await supabase
            .from('organization_subscriptions')
            .upsert({
                organization_id: input.organizationId,
                plan_id: input.planId,
                status: input.status ?? 'active',
                current_period_start: now.toISOString(),
                current_period_end: periodEnd.toISOString(),
                cancel_at_period_end: false,
                notes: input.notes ?? null,
            }, { onConflict: 'organization_id' })
            .select('id, organization_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end, notes, created_at, updated_at')
            .single()
        if (error) throw error

        // Set initial credits from plan
        await supabase
            .from('organizations')
            .update({ credits_balance: plan.data.monthly_credits })
            .eq('id', input.organizationId)

        return Subscription.fromRow({
            ...data,
            credits_balance: plan.data.monthly_credits,
            plan_name: input.planId,
            monthly_credits: plan.data.monthly_credits,
        })
    }

    async update(orgId: string, input: UpdateSubscriptionInput): Promise<Subscription | null> {
        const supabase = createAdminClient()
        const updateData: Record<string, unknown> = {}
        if (input.planId !== undefined) updateData.plan_id = input.planId
        if (input.status !== undefined) updateData.status = input.status
        if (input.cancelAtPeriodEnd !== undefined) updateData.cancel_at_period_end = input.cancelAtPeriodEnd
        if (input.notes !== undefined) updateData.notes = input.notes

        const { error } = await supabase
            .from('organization_subscriptions')
            .update(updateData)
            .eq('organization_id', orgId)
        if (error) throw error

        return this.findByOrgId(orgId)
    }

    async listAllWithOrgInfo(): Promise<Array<{
        orgId: string
        orgName: string
        planId: PlanId
        planName: string
        status: SubscriptionStatus
        creditsBalance: number
        currentPeriodEnd: string
    }>> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('organization_subscriptions')
            .select(`
                organization_id, plan_id, status, current_period_end,
                organizations ( name, credits_balance ),
                plans ( name )
            `)
            .order('created_at', { ascending: false })
        if (error) throw error

        return (data ?? []).map((row) => ({
            orgId: row.organization_id,
            orgName: (row.organizations as { name: string; credits_balance: number } | null)?.name ?? '',
            planId: row.plan_id as PlanId,
            planName: (row.plans as { name: string } | null)?.name ?? '',
            status: row.status as SubscriptionStatus,
            creditsBalance: (row.organizations as { name: string; credits_balance: number } | null)?.credits_balance ?? 0,
            currentPeriodEnd: row.current_period_end,
        }))
    }
}

export class SupabaseCreditRepository implements ICreditRepository {
    async getBalance(orgId: string): Promise<number> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('organizations')
            .select('credits_balance')
            .eq('id', orgId)
            .single()
        if (error) throw error
        return data?.credits_balance ?? 0
    }

    async consume(
        orgId: string,
        amount: number,
        type: CreditTransactionType,
        description: string,
        referenceId?: string,
        createdBy?: string,
    ): Promise<boolean> {
        const supabase = createAdminClient()
        const { data, error } = await supabase.rpc('consume_credits', {
            p_org_id: orgId,
            p_amount: amount,
            p_type: type,
            p_description: description,
            p_reference_id: referenceId ?? null,
            p_created_by: createdBy ?? null,
        })
        if (error) throw error
        return data === true
    }

    async add(
        orgId: string,
        amount: number,
        type: CreditTransactionType,
        description: string,
        referenceId?: string,
        createdBy?: string,
    ): Promise<number> {
        const supabase = createAdminClient()
        const { data, error } = await supabase.rpc('add_credits', {
            p_org_id: orgId,
            p_amount: amount,
            p_type: type,
            p_description: description,
            p_reference_id: referenceId ?? null,
            p_created_by: createdBy ?? null,
        })
        if (error) throw error
        return data as number
    }

    async listTransactions(orgId: string, limit = 50): Promise<CreditTransaction[]> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('credit_transactions')
            .select('id, organization_id, amount, type, description, reference_id, balance_after, created_at')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .limit(limit)
        if (error) throw error
        return (data ?? []).map(CreditTransaction.fromRow)
    }

    async listPacks(): Promise<CreditPack[]> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('credit_packs')
            .select('id, name, credits, price_brl, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
        if (error) throw error
        return (data ?? []).map(CreditPack.fromRow)
    }
}

import { createAdminClient } from '@/lib/supabase/admin'
import type { IPlanRepository } from '@/domain/interfaces/plan-repository'
import type { PlanConfig, PlanLimits, PlanUsage, ResourceKey } from '@/domain/entities/plan'

// Row types for tables/views not fully exposed in Database generic
type PlanRow = {
    id: string; name: string; landing_pages_limit: number; contacts_limit: number
    emails_monthly_limit: number; whatsapp_monthly_limit: number; automations_limit: number
    knowledge_base_limit: number; price_brl: number; updated_at: string
}
type OverrideRow = {
    organization_id: string; landing_pages_limit: number | null; contacts_limit: number | null
    emails_monthly_limit: number | null; whatsapp_monthly_limit: number | null
    automations_limit: number | null; knowledge_base_limit: number | null; notes: string | null; updated_at: string
}
type EffectiveLimitsRow = {
    organization_id: string; plan: string; landing_pages_limit: number; contacts_limit: number
    emails_monthly_limit: number; whatsapp_monthly_limit: number; automations_limit: number; knowledge_base_limit: number
}

const FREE_LIMITS: PlanLimits = {
    landingPagesLimit: 1,
    contactsLimit: 100,
    emailsMonthlyLimit: 500,
    whatsappMonthlyLimit: 0,
    automationsLimit: 1,
    knowledgeBaseLimit: 0,
}

function rowToLimits(row: PlanRow | EffectiveLimitsRow | OverrideRow): PlanLimits {
    return {
        landingPagesLimit: (row as PlanRow).landing_pages_limit,
        contactsLimit: (row as PlanRow).contacts_limit,
        emailsMonthlyLimit: (row as PlanRow).emails_monthly_limit,
        whatsappMonthlyLimit: (row as PlanRow).whatsapp_monthly_limit,
        automationsLimit: (row as PlanRow).automations_limit,
        knowledgeBaseLimit: (row as PlanRow).knowledge_base_limit,
    }
}

export class SupabasePlanRepository implements IPlanRepository {
    private get db() {
        return createAdminClient()
    }

    async getAllPlans(): Promise<PlanConfig[]> {
        const { data } = await this.db
            .from('plans')
            .select('*')
            .order('price_brl') as unknown as { data: PlanRow[] | null }
        return (data ?? []).map(r => ({
            id: r.id,
            name: r.name,
            limits: rowToLimits(r),
            priceBrl: r.price_brl,
            updatedAt: r.updated_at,
        }))
    }

    async getPlanById(planId: string): Promise<PlanConfig | null> {
        const { data } = await this.db
            .from('plans')
            .select('*')
            .eq('id', planId as never)
            .single() as unknown as { data: PlanRow | null }
        if (!data) return null
        return {
            id: data.id,
            name: data.name,
            limits: rowToLimits(data),
            priceBrl: data.price_brl,
            updatedAt: data.updated_at,
        }
    }

    async updatePlanLimits(
        planId: string,
        updates: Partial<PlanLimits> & { name?: string; priceBrl?: number },
    ): Promise<void> {
        const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (updates.name !== undefined) row.name = updates.name
        if (updates.landingPagesLimit !== undefined) row.landing_pages_limit = updates.landingPagesLimit
        if (updates.contactsLimit !== undefined) row.contacts_limit = updates.contactsLimit
        if (updates.emailsMonthlyLimit !== undefined) row.emails_monthly_limit = updates.emailsMonthlyLimit
        if (updates.whatsappMonthlyLimit !== undefined) row.whatsapp_monthly_limit = updates.whatsappMonthlyLimit
        if (updates.automationsLimit !== undefined) row.automations_limit = updates.automationsLimit
        if (updates.knowledgeBaseLimit !== undefined) row.knowledge_base_limit = updates.knowledgeBaseLimit
        if (updates.priceBrl !== undefined) row.price_brl = updates.priceBrl
        await (this.db.from('plans').update(row as never).eq('id', planId as never))
    }

    async getEffectiveLimits(orgId: string): Promise<PlanLimits & { plan: string }> {
        const { data } = await this.db
            .from('organization_effective_limits' as 'plans')
            .select('*')
            .eq('organization_id' as 'id', orgId as never)
            .single() as unknown as { data: EffectiveLimitsRow | null }
        if (!data) return { plan: 'free', ...FREE_LIMITS }
        return {
            plan: data.plan,
            ...rowToLimits(data),
        }
    }

    async getOrgUsage(orgId: string): Promise<PlanUsage> {
        const monthStart = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1,
        ).toISOString()

        const supabase = this.db
        const [
            { count: landingPages },
            { count: contacts },
            { data: campaigns },
            { count: whatsappThisMonth },
            { count: automations },
            { count: knowledgeBase },
        ] = await Promise.all([
            supabase.from('landing_pages').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
            supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
            supabase.from('campaigns').select('metrics').eq('organization_id', orgId).eq('status', 'sent').gte('sent_at', monthStart),
            supabase.from('messages').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('channel', 'whatsapp').eq('direction', 'outbound').gte('created_at', monthStart),
            supabase.from('automations').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('active', true),
            supabase.from('knowledge_base').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        ])

        const emailsThisMonth = ((campaigns ?? []) as Array<{ metrics: unknown }>).reduce((sum, c) => {
            const m = c.metrics as Record<string, number> | null
            return sum + (m?.total_sent ?? 0)
        }, 0)

        return {
            landingPages: landingPages ?? 0,
            contacts: contacts ?? 0,
            emailsThisMonth,
            whatsappThisMonth: whatsappThisMonth ?? 0,
            automations: automations ?? 0,
            knowledgeBase: knowledgeBase ?? 0,
        }
    }

    async getOrgOverride(orgId: string): Promise<(Partial<PlanLimits> & { notes?: string }) | null> {
        const { data } = await this.db
            .from('organization_plan_overrides' as 'plans')
            .select('*')
            .eq('organization_id' as 'id', orgId as never)
            .maybeSingle() as unknown as { data: OverrideRow | null }
        if (!data) return null
        const overrides: Partial<PlanLimits> & { notes?: string } = {}
        if (data.landing_pages_limit !== null) overrides.landingPagesLimit = data.landing_pages_limit
        if (data.contacts_limit !== null) overrides.contactsLimit = data.contacts_limit
        if (data.emails_monthly_limit !== null) overrides.emailsMonthlyLimit = data.emails_monthly_limit
        if (data.whatsapp_monthly_limit !== null) overrides.whatsappMonthlyLimit = data.whatsapp_monthly_limit
        if (data.automations_limit !== null) overrides.automationsLimit = data.automations_limit
        if (data.knowledge_base_limit !== null) overrides.knowledgeBaseLimit = data.knowledge_base_limit
        if (data.notes) overrides.notes = data.notes
        return Object.keys(overrides).length > 0 ? overrides : null
    }

    async setOrgOverride(
        orgId: string,
        overrides: Partial<PlanLimits> & { notes?: string },
    ): Promise<void> {
        const row: Record<string, unknown> = {
            organization_id: orgId,
            updated_at: new Date().toISOString(),
        }
        if (overrides.landingPagesLimit !== undefined) row.landing_pages_limit = overrides.landingPagesLimit
        if (overrides.contactsLimit !== undefined) row.contacts_limit = overrides.contactsLimit
        if (overrides.emailsMonthlyLimit !== undefined) row.emails_monthly_limit = overrides.emailsMonthlyLimit
        if (overrides.whatsappMonthlyLimit !== undefined) row.whatsapp_monthly_limit = overrides.whatsappMonthlyLimit
        if (overrides.automationsLimit !== undefined) row.automations_limit = overrides.automationsLimit
        if (overrides.knowledgeBaseLimit !== undefined) row.knowledge_base_limit = overrides.knowledgeBaseLimit
        if (overrides.notes !== undefined) row.notes = overrides.notes
        await (this.db
            .from('organization_plan_overrides' as 'plans')
            .upsert(row as never, { onConflict: 'organization_id' }))
    }

    async clearOrgOverride(orgId: string): Promise<void> {
        await this.db
            .from('organization_plan_overrides' as 'plans')
            .delete()
            .eq('organization_id' as 'id', orgId as never)
    }

    async countResource(orgId: string, resource: ResourceKey): Promise<number> {
        const supabase = this.db
        const monthStart = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1,
        ).toISOString()

        switch (resource) {
            case 'contacts': {
                const { count } = await supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('organization_id', orgId)
                return count ?? 0
            }
            case 'landing_pages': {
                const { count } = await supabase.from('landing_pages').select('*', { count: 'exact', head: true }).eq('organization_id', orgId)
                return count ?? 0
            }
            case 'emails_monthly': {
                const { data } = await supabase.from('campaigns').select('metrics').eq('organization_id', orgId).eq('status', 'sent').gte('sent_at', monthStart)
                return ((data ?? []) as Array<{ metrics: unknown }>).reduce((sum, c) => {
                    const m = c.metrics as Record<string, number> | null
                    return sum + (m?.total_sent ?? 0)
                }, 0)
            }
            case 'whatsapp_monthly': {
                const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('channel', 'whatsapp').eq('direction', 'outbound').gte('created_at', monthStart)
                return count ?? 0
            }
            case 'automations': {
                const { count } = await supabase.from('automations').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('active', true)
                return count ?? 0
            }
            case 'knowledge_base': {
                const { count } = await supabase.from('knowledge_base').select('*', { count: 'exact', head: true }).eq('organization_id', orgId)
                return count ?? 0
            }
        }
    }
}

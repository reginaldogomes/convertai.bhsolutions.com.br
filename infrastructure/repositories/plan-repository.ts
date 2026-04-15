import { createAdminClient } from '@/lib/supabase/admin'
import { Plan } from '@/domain/entities'
import type { IPlanRepository, UpsertPlanInput } from '@/domain/interfaces'
import type { PlanId } from '@/types/database'

export class SupabasePlanRepository implements IPlanRepository {
    private readonly SELECT_FIELDS = 'id, name, description, price_brl, monthly_credits, max_contacts, max_landing_pages, max_users, max_automations, features, is_active, sort_order'

    async findAll(): Promise<Plan[]> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('plans')
            .select(this.SELECT_FIELDS)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
        if (error) throw error
        return (data ?? []).map(Plan.fromRow)
    }

    async findAllAdmin(): Promise<Plan[]> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('plans')
            .select(this.SELECT_FIELDS)
            .order('sort_order', { ascending: true })
        if (error) throw error
        return (data ?? []).map(Plan.fromRow)
    }

    async findById(id: PlanId): Promise<Plan | null> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('plans')
            .select(this.SELECT_FIELDS)
            .eq('id', id)
            .single()
        if (error) {
            if (error.code === 'PGRST116') return null
            throw error
        }
        return data ? Plan.fromRow(data) : null
    }

    async upsert(input: UpsertPlanInput): Promise<Plan> {
        const supabase = createAdminClient()
        const row = {
            ...(input.id ? { id: input.id } : {}),
            name: input.name,
            description: input.description,
            price_brl: input.priceBrl,
            monthly_credits: input.monthlyCredits,
            max_contacts: input.maxContacts,
            max_landing_pages: input.maxLandingPages,
            max_users: input.maxUsers,
            max_automations: input.maxAutomations,
            features: input.features,
            is_active: input.isActive,
            sort_order: input.sortOrder,
        }
        const { data, error } = await supabase
            .from('plans')
            .upsert(row, { onConflict: 'id' })
            .select(this.SELECT_FIELDS)
            .single()
        if (error) throw error
        return Plan.fromRow(data)
    }
}

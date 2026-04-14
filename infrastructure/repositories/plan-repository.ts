import { createAdminClient } from '@/lib/supabase/admin'
import { Plan } from '@/domain/entities'
import type { IPlanRepository } from '@/domain/interfaces'
import type { PlanId } from '@/types/database'

export class SupabasePlanRepository implements IPlanRepository {
    async findAll(): Promise<Plan[]> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('plans')
            .select('id, name, description, price_brl, monthly_credits, max_contacts, max_landing_pages, max_users, max_automations, features, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
        if (error) throw error
        return (data ?? []).map(Plan.fromRow)
    }

    async findById(id: PlanId): Promise<Plan | null> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('plans')
            .select('id, name, description, price_brl, monthly_credits, max_contacts, max_landing_pages, max_users, max_automations, features, is_active, sort_order')
            .eq('id', id)
            .single()
        if (error) {
            if (error.code === 'PGRST116') return null
            throw error
        }
        return data ? Plan.fromRow(data) : null
    }
}

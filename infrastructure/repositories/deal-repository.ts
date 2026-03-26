import { createAdminClient } from '@/lib/supabase/admin'
import { Deal } from '@/domain/entities'
import type { IDealRepository, CreateDealInput } from '@/domain/interfaces'
import type { PipelineStage } from '@/types/database'

export class SupabaseDealRepository implements IDealRepository {
    async findByOrgId(orgId: string): Promise<Deal[]> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('deals')
            .select('*, contacts (name, company)')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
        return (data ?? []).map((row) => Deal.fromRow({
            ...row,
            contacts: row.contacts as unknown as { name: string; company: string | null } | null,
        }))
    }

    async findByContactId(contactId: string): Promise<Deal[]> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('deals')
            .select('*')
            .eq('contact_id', contactId)
            .order('created_at', { ascending: false })
        return (data ?? []).map((row) =>
            Deal.fromRow({ ...row, contacts: null })
        )
    }

    async create(input: CreateDealInput): Promise<Deal | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('deals')
            .insert({
                organization_id: input.organizationId,
                contact_id: input.contactId,
                title: input.title,
                pipeline_stage: input.pipelineStage,
                value: input.value,
            })
            .select()
            .single()
        return data ? Deal.fromRow({ ...data, contacts: null }) : null
    }

    async updateStage(dealId: string, stage: PipelineStage, orgId: string): Promise<boolean> {
        const supabase = createAdminClient()
        const { error } = await supabase
            .from('deals')
            .update({ pipeline_stage: stage })
            .eq('id', dealId)
            .eq('organization_id', orgId)
        return !error
    }

    async getStatsForOrg(orgId: string): Promise<{ total: number; won: number }> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('deals')
            .select('id, status')
            .eq('organization_id', orgId)
        const total = data?.length ?? 0
        const won = data?.filter(d => d.status === 'won').length ?? 0
        return { total, won }
    }
}

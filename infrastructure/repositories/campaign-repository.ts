import { createAdminClient } from '@/lib/supabase/admin'
import { Campaign } from '@/domain/entities'
import type { ICampaignRepository, CampaignRow, CreateCampaignInput, UpdateCampaignInput } from '@/domain/interfaces'
import type { CampaignStatus } from '@/types/database'

export class SupabaseCampaignRepository implements ICampaignRepository {
    async findById(id: string): Promise<Campaign | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', id)
            .single()
        return data ? Campaign.fromRow(data) : null
    }

    async findByOrgId(orgId: string): Promise<CampaignRow[]> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('campaigns')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
        return (data ?? []) as CampaignRow[]
    }

    async create(input: CreateCampaignInput): Promise<Campaign | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('campaigns')
            .insert({
                organization_id: input.organizationId,
                name: input.name,
                subject: input.subject,
                body: input.body,
                channel: input.channel || 'email',
                status: 'draft',
            })
            .select()
            .single()
        return data ? Campaign.fromRow(data) : null
    }

    async update(id: string, orgId: string, input: UpdateCampaignInput): Promise<Campaign | null> {
        const supabase = createAdminClient()
        const updateData: Record<string, string> = {}
        if (input.name !== undefined) updateData.name = input.name
        if (input.subject !== undefined) updateData.subject = input.subject
        if (input.body !== undefined) updateData.body = input.body
        if (input.channel !== undefined) updateData.channel = input.channel

        const { data } = await supabase
            .from('campaigns')
            .update(updateData)
            .eq('id', id)
            .eq('organization_id', orgId)
            .eq('status', 'draft')
            .select()
            .single()
        return data ? Campaign.fromRow(data) : null
    }

    async updateStatus(id: string, orgId: string, status: CampaignStatus, metrics?: Record<string, number>): Promise<boolean> {
        const supabase = createAdminClient()
        const updateData: Record<string, unknown> = { status }
        if (status === 'sent') updateData.sent_at = new Date().toISOString()
        if (metrics) updateData.metrics = metrics

        const { error } = await supabase
            .from('campaigns')
            .update(updateData)
            .eq('id', id)
            .eq('organization_id', orgId)
        return !error
    }

    async countSentByOrgId(orgId: string): Promise<number> {
        const supabase = createAdminClient()
        const { count } = await supabase
            .from('campaigns')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('status', 'sent')
        return count ?? 0
    }
}

import { createAdminClient } from '@/lib/supabase/admin'
import { Campaign } from '@/domain/entities'
import type { ICampaignRepository, CampaignRow, CreateCampaignInput, UpdateCampaignInput } from '@/domain/interfaces'
import type { IAutomationRepository, AutomationRow, CreateAutomationInput, UpdateAutomationInput } from '@/domain/interfaces'
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

export class SupabaseAutomationRepository implements IAutomationRepository {
    async findByOrgId(orgId: string): Promise<AutomationRow[]> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('automations')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
        return (data ?? []) as AutomationRow[]
    }

    async findById(id: string, orgId: string): Promise<AutomationRow | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('automations')
            .select('*')
            .eq('id', id)
            .eq('organization_id', orgId)
            .single()
        return data as AutomationRow | null
    }

    async create(input: CreateAutomationInput): Promise<AutomationRow | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('automations')
            .insert({
                organization_id: input.organizationId,
                name: input.name,
                trigger_event: input.triggerEvent,
                workflow_json: input.workflowJson as never,
                active: false,
            })
            .select()
            .single()
        return data as AutomationRow | null
    }

    async update(id: string, orgId: string, input: UpdateAutomationInput): Promise<AutomationRow | null> {
        const supabase = createAdminClient()
        const updateData: Record<string, unknown> = {}
        if (input.name !== undefined) updateData.name = input.name
        if (input.triggerEvent !== undefined) updateData.trigger_event = input.triggerEvent
        if (input.workflowJson !== undefined) updateData.workflow_json = input.workflowJson
        if (input.active !== undefined) updateData.active = input.active

        const { data } = await supabase
            .from('automations')
            .update(updateData as never)
            .eq('id', id)
            .eq('organization_id', orgId)
            .select()
            .single()
        return data as AutomationRow | null
    }

    async delete(id: string, orgId: string): Promise<boolean> {
        const supabase = createAdminClient()
        const { error } = await supabase
            .from('automations')
            .delete()
            .eq('id', id)
            .eq('organization_id', orgId)
        return !error
    }

    async toggleActive(id: string, orgId: string, active: boolean): Promise<boolean> {
        const supabase = createAdminClient()
        const { error } = await supabase
            .from('automations')
            .update({ active } as never)
            .eq('id', id)
            .eq('organization_id', orgId)
        return !error
    }
}

import { createAdminClient } from '@/lib/supabase/admin'
import { Automation } from '@/domain/entities'
import type { IAutomationRepository, CreateAutomationInput, UpdateAutomationInput } from '@/domain/interfaces'
import type { Json } from '@/types/database'

export class SupabaseAutomationRepository implements IAutomationRepository {
    async findByOrgId(orgId: string): Promise<Automation[]> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('automations')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
        return (data ?? []).map(row => Automation.fromRow(row))
    }

    async findById(id: string, orgId: string): Promise<Automation | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('automations')
            .select('*')
            .eq('id', id)
            .eq('organization_id', orgId)
            .single()
        return data ? Automation.fromRow(data) : null
    }

    async create(input: CreateAutomationInput): Promise<Automation | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('automations')
            .insert({
                organization_id: input.organizationId,
                name: input.name,
                trigger_event: input.triggerEvent,
                workflow_json: input.workflowJson as unknown as Json,
                active: false,
            })
            .select()
            .single()
        return data ? Automation.fromRow(data) : null
    }

    async update(id: string, orgId: string, input: UpdateAutomationInput): Promise<Automation | null> {
        const supabase = createAdminClient()
        const updateData: Record<string, unknown> = {}
        if (input.name !== undefined) updateData.name = input.name
        if (input.triggerEvent !== undefined) updateData.trigger_event = input.triggerEvent
        if (input.workflowJson !== undefined) updateData.workflow_json = input.workflowJson as unknown as Json
        if (input.active !== undefined) updateData.active = input.active

        const { data } = await supabase
            .from('automations')
            .update(updateData)
            .eq('id', id)
            .eq('organization_id', orgId)
            .select()
            .single()
        return data ? Automation.fromRow(data) : null
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
            .update({ active })
            .eq('id', id)
            .eq('organization_id', orgId)
        return !error
    }
}

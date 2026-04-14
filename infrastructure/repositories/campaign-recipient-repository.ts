import { createAdminClient } from '@/lib/supabase/admin'
import { CampaignRecipient } from '@/domain/entities'
import type { ICampaignRecipientRepository, CreateCampaignRecipientInput } from '@/domain/interfaces'
import type { CampaignRecipientStatus } from '@/types/database'

export class SupabaseCampaignRecipientRepository implements ICampaignRecipientRepository {

    async bulkCreate(recipients: CreateCampaignRecipientInput[]): Promise<void> {
        if (recipients.length === 0) return
        const supabase = createAdminClient()
        const rows = recipients.map(r => ({
            campaign_id: r.campaignId,
            organization_id: r.organizationId,
            contact_id: r.contactId ?? null,
            contact_name: r.contactName,
            recipient_address: r.recipientAddress,
            status: r.status ?? 'pending',
            twilio_sid: r.twilioSid ?? null,
            error_message: r.errorMessage ?? null,
            sent_at: r.sentAt ?? null,
        }))

        // Inserir em lotes de 500 para evitar limite de payload
        for (let i = 0; i < rows.length; i += 500) {
            const batch = rows.slice(i, i + 500)
            const { error } = await supabase.from('campaign_recipients').insert(batch)
            if (error) throw error
        }
    }

    async updateByTwilioSid(
        twilioSid: string,
        status: CampaignRecipientStatus,
        extra?: { deliveredAt?: string; readAt?: string; errorMessage?: string },
    ): Promise<boolean> {
        const supabase = createAdminClient()
        const updateData: Record<string, unknown> = { status }
        if (extra?.deliveredAt) updateData.delivered_at = extra.deliveredAt
        if (extra?.readAt) updateData.read_at = extra.readAt
        if (extra?.errorMessage !== undefined) updateData.error_message = extra.errorMessage

        const { error } = await supabase
            .from('campaign_recipients')
            .update(updateData)
            .eq('twilio_sid', twilioSid)
        return !error
    }

    async findByCampaignId(campaignId: string, orgId: string): Promise<CampaignRecipient[]> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('campaign_recipients')
            .select('id, campaign_id, organization_id, contact_id, contact_name, recipient_address, status, twilio_sid, error_message, sent_at, delivered_at, read_at, created_at')
            .eq('campaign_id', campaignId)
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
        if (error) throw error
        return (data ?? []).map(CampaignRecipient.fromRow)
    }

    async countByCampaignAndStatus(
        campaignId: string,
        orgId: string,
    ): Promise<Record<CampaignRecipientStatus, number>> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('campaign_recipients')
            .select('status')
            .eq('campaign_id', campaignId)
            .eq('organization_id', orgId)
        if (error) throw error

        const counts: Record<CampaignRecipientStatus, number> = {
            pending: 0,
            sent: 0,
            failed: 0,
            delivered: 0,
            read: 0,
        }
        for (const row of data ?? []) {
            const s = row.status as CampaignRecipientStatus
            counts[s] = (counts[s] ?? 0) + 1
        }
        return counts
    }
}

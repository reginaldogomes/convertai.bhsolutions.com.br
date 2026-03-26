import { createAdminClient } from '@/lib/supabase/admin'
import { Message } from '@/domain/entities'
import type { IMessageRepository, CreateMessageInput, RawMessageWithContact } from '@/domain/interfaces'

export class SupabaseMessageRepository implements IMessageRepository {
    async findByOrgId(orgId: string): Promise<RawMessageWithContact[]> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('messages')
            .select('*, contacts (id, name, phone)')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
        return (data ?? []) as unknown as RawMessageWithContact[]
    }

    async findByContactId(contactId: string, limit = 10): Promise<Message[]> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('contact_id', contactId)
            .order('created_at', { ascending: false })
            .limit(limit)
        return (data ?? []).map(Message.fromRow)
    }

    async create(input: CreateMessageInput): Promise<Message | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('messages')
            .insert({
                organization_id: input.organizationId,
                contact_id: input.contactId,
                channel: input.channel,
                content: input.content,
                direction: input.direction,
            })
            .select()
            .single()
        return data ? Message.fromRow(data) : null
    }

    async countInboundByOrgId(orgId: string): Promise<number> {
        const supabase = createAdminClient()
        const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('direction', 'inbound')
        return count ?? 0
    }
}

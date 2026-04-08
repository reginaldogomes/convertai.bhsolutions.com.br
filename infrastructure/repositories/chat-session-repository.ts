import { createAdminClient } from '@/lib/supabase/admin'
import { ChatSession, ChatMessage } from '@/domain/entities'
import type { IChatSessionRepository, CreateChatSessionInput, CreateChatMessageInput } from '@/domain/interfaces'

export class SupabaseChatSessionRepository implements IChatSessionRepository {
    async findById(id: string): Promise<ChatSession | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('id', id)
            .single()
        return data ? ChatSession.fromRow(data) : null
    }

    async findByVisitor(landingPageId: string, visitorId: string): Promise<ChatSession | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('landing_page_id', landingPageId)
            .eq('visitor_id', visitorId)
            .in('status', ['active', 'lead_captured'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        return data ? ChatSession.fromRow(data) : null
    }

    async create(input: CreateChatSessionInput): Promise<ChatSession | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('chat_sessions')
            .insert({
                landing_page_id: input.landingPageId,
                visitor_id: input.visitorId,
            })
            .select()
            .single()
        return data ? ChatSession.fromRow(data) : null
    }

    async updateContactId(sessionId: string, contactId: string): Promise<boolean> {
        const supabase = createAdminClient()
        const { error } = await supabase
            .from('chat_sessions')
            .update({
                contact_id: contactId,
                status: 'lead_captured',
                updated_at: new Date().toISOString(),
            })
            .eq('id', sessionId)
        return !error
    }

    async updateStatus(sessionId: string, status: string): Promise<boolean> {
        const supabase = createAdminClient()
        const { error } = await supabase
            .from('chat_sessions')
            .update({ status: status as 'active' | 'lead_captured' | 'closed', updated_at: new Date().toISOString() })
            .eq('id', sessionId)
        return !error
    }

    async getMessages(sessionId: string): Promise<ChatMessage[]> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
        return (data ?? []).map(ChatMessage.fromRow)
    }

    async addMessage(input: CreateChatMessageInput): Promise<ChatMessage | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('chat_messages')
            .insert({
                session_id: input.sessionId,
                role: input.role,
                content: input.content,
            })
            .select()
            .single()
        return data ? ChatMessage.fromRow(data) : null
    }

    async countByPageId(pageId: string): Promise<number> {
        const supabase = createAdminClient()
        const { count } = await supabase
            .from('chat_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('landing_page_id', pageId)
        return count ?? 0
    }
}

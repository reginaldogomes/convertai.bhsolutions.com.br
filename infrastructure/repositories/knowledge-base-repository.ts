import { createAdminClient } from '@/lib/supabase/admin'
import { KnowledgeBase } from '@/domain/entities'
import type { IKnowledgeBaseRepository, CreateKnowledgeBaseInput, KnowledgeBaseMatch } from '@/domain/interfaces'

export class SupabaseKnowledgeBaseRepository implements IKnowledgeBaseRepository {
    async findByOrgId(orgId: string): Promise<KnowledgeBase[]> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('knowledge_base')
            .select('id, organization_id, landing_page_id, title, content, metadata_json, created_at')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
        return (data ?? []).map(KnowledgeBase.fromRow)
    }

    async findByPageId(pageId: string): Promise<KnowledgeBase[]> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('knowledge_base')
            .select('id, organization_id, landing_page_id, title, content, metadata_json, created_at')
            .eq('landing_page_id', pageId)
            .order('created_at', { ascending: false })
        return (data ?? []).map(KnowledgeBase.fromRow)
    }

    async create(input: CreateKnowledgeBaseInput): Promise<KnowledgeBase | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('knowledge_base')
            .insert({
                organization_id: input.organizationId,
                landing_page_id: input.landingPageId,
                title: input.title,
                content: input.content,
            })
            .select('id, organization_id, landing_page_id, title, content, metadata_json, created_at')
            .single()
        return data ? KnowledgeBase.fromRow(data) : null
    }

    async updateEmbedding(id: string, embedding: number[]): Promise<boolean> {
        const supabase = createAdminClient()
        const { error } = await supabase
            .from('knowledge_base')
            .update({ embedding: JSON.stringify(embedding) })
            .eq('id', id)
        return !error
    }

    async delete(id: string, orgId: string): Promise<boolean> {
        const supabase = createAdminClient()
        const { error } = await supabase
            .from('knowledge_base')
            .delete()
            .eq('id', id)
            .eq('organization_id', orgId)
        return !error
    }

    async searchSimilar(
        embedding: number[],
        orgId: string,
        pageId?: string,
        threshold = 0.7,
        limit = 5
    ): Promise<KnowledgeBaseMatch[]> {
        const supabase = createAdminClient()
        const { data, error } = await supabase.rpc('match_knowledge_base', {
            query_embedding: JSON.stringify(embedding),
            match_org_id: orgId,
            match_page_id: pageId ?? null,
            match_threshold: threshold,
            match_count: limit,
        })
        if (error || !data) return []
        return (data as Array<{ id: string; title: string; content: string; similarity: number }>)
    }
}

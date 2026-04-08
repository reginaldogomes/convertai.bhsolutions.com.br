import { createAdminClient } from '@/lib/supabase/admin'
import { KnowledgeBase } from '@/domain/entities'
import type { IKnowledgeBaseRepository, CreateKnowledgeBaseInput, KnowledgeBaseMatch, RagSearchFilters } from '@/domain/interfaces'

function normalizeText(value: unknown): string {
    return String(value ?? '').toLowerCase().trim()
}

function hasToken(haystack: string, token: string): boolean {
    if (!token) return false
    return haystack.includes(token)
}

function scoreByFilters(content: string, metadata: Record<string, unknown>, filters?: RagSearchFilters): number {
    if (!filters) return 0

    const metadataText = JSON.stringify(metadata ?? {}).toLowerCase()
    const fullText = `${content} ${metadataText}`
    const metadataTags = Array.isArray(metadata?.tags)
        ? (metadata.tags as unknown[])
            .filter((tag): tag is string => typeof tag === 'string')
            .map((tag) => tag.toLowerCase().trim())
        : []

    let score = 0
    const niche = normalizeText(filters.niche)
    const audience = normalizeText(filters.targetAudience)
    const brandName = normalizeText(filters.brandName)
    const locale = normalizeText(filters.locale)

    if (niche && hasToken(fullText, niche)) score += 0.08
    if (niche && metadataTags.some((tag) => hasToken(tag, niche) || hasToken(niche, tag))) score += 0.06
    if (audience && hasToken(fullText, audience)) score += 0.08
    if (audience && metadataTags.some((tag) => hasToken(tag, audience) || hasToken(audience, tag))) score += 0.06
    if (brandName && hasToken(fullText, brandName)) score += 0.04
    if (brandName && metadataTags.some((tag) => hasToken(tag, brandName) || hasToken(brandName, tag))) score += 0.03
    if (locale && hasToken(fullText, locale)) score += 0.03
    if (locale && metadataTags.some((tag) => hasToken(tag, locale) || hasToken(locale, tag))) score += 0.02

    const keywords = (filters.intentKeywords ?? [])
        .map((keyword) => normalizeText(keyword))
        .filter((keyword) => keyword.length >= 3)

    for (const keyword of keywords.slice(0, 8)) {
        if (hasToken(fullText, keyword)) score += 0.015
        if (metadataTags.some((tag) => hasToken(tag, keyword) || hasToken(keyword, tag))) score += 0.012
    }

    return score
}

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
        limit = 5,
        filters?: RagSearchFilters,
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

        const baseMatches = data as Array<{ id: string; title: string; content: string; similarity: number }>
        if (baseMatches.length === 0) return []
        if (!filters) return baseMatches

        const ids = baseMatches.map((match) => match.id)
        const { data: metadataRows } = await supabase
            .from('knowledge_base')
            .select('id, metadata_json, title, content')
            .in('id', ids)

        const metadataMap = new Map(
            (metadataRows ?? []).map((row: { id: string; metadata_json: unknown; title: string; content: string }) => [
                row.id,
                {
                    metadataJson: (row.metadata_json as Record<string, unknown>) ?? {},
                    text: `${row.title}\n${row.content}`.toLowerCase(),
                },
            ])
        )

        const reranked = baseMatches
            .map((match) => {
                const metadataRow = metadataMap.get(match.id)
                const metadataJson = metadataRow?.metadataJson ?? {}
                const filterBoost = scoreByFilters(match.content.toLowerCase(), metadataJson, filters)

                return {
                    ...match,
                    similarity: Number((match.similarity + filterBoost).toFixed(6)),
                    metadataJson,
                }
            })
            .sort((a, b) => b.similarity - a.similarity)

        return reranked.slice(0, limit)
    }
}

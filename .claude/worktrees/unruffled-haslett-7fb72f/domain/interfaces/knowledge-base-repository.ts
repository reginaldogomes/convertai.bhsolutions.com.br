import type { KnowledgeBase } from '@/domain/entities'

export interface CreateKnowledgeBaseInput {
    organizationId: string
    landingPageId?: string | null
    productId?: string | null
    title: string
    content: string
    metadata?: Record<string, unknown>
}

export interface RagSearchFilters {
    niche?: string
    targetAudience?: string
    brandName?: string
    locale?: string
    intentKeywords?: string[]
}

export interface KnowledgeBaseMatch {
    id: string
    title: string
    content: string
    similarity: number
    metadataJson?: Record<string, unknown>
}

export interface IKnowledgeBaseRepository {
    findByOrgId(orgId: string): Promise<KnowledgeBase[]>
    findByPageId(pageId: string): Promise<KnowledgeBase[]>
    create(input: CreateKnowledgeBaseInput): Promise<KnowledgeBase | null>
    updateEmbedding(id: string, embedding: number[]): Promise<boolean>
    update(id: string, orgId: string, updates: Partial<CreateKnowledgeBaseInput>): Promise<KnowledgeBase | null>
    delete(id: string, orgId: string): Promise<boolean>
    purgeHistory(orgId: string, retentionDays: number): Promise<number>
    searchSimilar(
        embedding: number[],
        orgId: string,
        pageId?: string,
        threshold?: number,
        limit?: number,
        filters?: RagSearchFilters,
    ): Promise<KnowledgeBaseMatch[]>
}

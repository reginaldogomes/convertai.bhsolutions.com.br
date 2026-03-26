import type { KnowledgeBase } from '@/domain/entities'

export interface CreateKnowledgeBaseInput {
    organizationId: string
    landingPageId: string | null
    title: string
    content: string
}

export interface KnowledgeBaseMatch {
    id: string
    title: string
    content: string
    similarity: number
}

export interface IKnowledgeBaseRepository {
    findByOrgId(orgId: string): Promise<KnowledgeBase[]>
    findByPageId(pageId: string): Promise<KnowledgeBase[]>
    create(input: CreateKnowledgeBaseInput): Promise<KnowledgeBase | null>
    updateEmbedding(id: string, embedding: number[]): Promise<boolean>
    delete(id: string, orgId: string): Promise<boolean>
    searchSimilar(embedding: number[], orgId: string, pageId?: string, threshold?: number, limit?: number): Promise<KnowledgeBaseMatch[]>
}

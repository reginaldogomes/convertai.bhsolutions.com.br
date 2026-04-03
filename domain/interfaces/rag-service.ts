import type { KnowledgeBaseMatch } from './knowledge-base-repository'

export interface IRagService {
    generateEmbedding(text: string): Promise<number[]>
    indexContent(id: string, content: string): Promise<boolean>
    search(query: string, orgId: string, pageId?: string): Promise<KnowledgeBaseMatch[]>
    formatContextForLLM(matches: KnowledgeBaseMatch[]): string
}

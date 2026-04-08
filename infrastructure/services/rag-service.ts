import { embed } from 'ai'
import { google } from '@ai-sdk/google'
import type { IKnowledgeBaseRepository, KnowledgeBaseMatch, IRagService, RagSearchFilters } from '@/domain/interfaces'

export class RagService implements IRagService {
    constructor(private knowledgeBaseRepo: IKnowledgeBaseRepository) {}

    async generateEmbedding(text: string): Promise<number[]> {
        const { embedding } = await embed({
            model: google.embedding('gemini-embedding-001'),
            value: text,
        })
        return embedding
    }

    async indexContent(id: string, content: string): Promise<boolean> {
        const embedding = await this.generateEmbedding(content)
        return this.knowledgeBaseRepo.updateEmbedding(id, embedding)
    }

    async search(query: string, orgId: string, pageId?: string, filters?: RagSearchFilters): Promise<KnowledgeBaseMatch[]> {
        const embedding = await this.generateEmbedding(query)
        return this.knowledgeBaseRepo.searchSimilar(embedding, orgId, pageId, 0.6, 8, filters)
    }

    formatContextForLLM(matches: KnowledgeBaseMatch[]): string {
        if (matches.length === 0) return ''
        const docs = matches.map((m, i) => `[${i + 1}] ${m.title}\n${m.content}`).join('\n\n---\n\n')
        return `Contexto da base de conhecimento:\n\n${docs}`
    }
}

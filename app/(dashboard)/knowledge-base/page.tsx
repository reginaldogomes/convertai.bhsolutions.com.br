import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { PageHeader } from '@/components/layout/PageHeader'
import { BookOpen } from 'lucide-react'
import { KnowledgeTabs } from './knowledge-tabs'

export const metadata = { title: 'Base de Conhecimento' }

export type KnowledgeEntryView = {
    id: string
    title: string
    createdAt: string
    content: string
    preview: string
    tags: string[]
    entryType: string
    source: string
    imageUrl?: string
}

async function loadAllEntries(orgId: string): Promise<KnowledgeEntryView[]> {
    try {
        const entries = await useCases.listKnowledgeBase().execute(orgId)

        return entries
            .filter((e) => e.landingPageId === null)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((e) => {
                const meta = e.metadataJson ?? {}
                const rawTags = Array.isArray(meta.tags)
                    ? (meta.tags as unknown[]).filter((t): t is string => typeof t === 'string' && t.trim().length > 0).slice(0, 24)
                    : []
                return {
                    id: e.id,
                    title: e.title,
                    createdAt: e.createdAt,
                    content: e.content,
                    preview: e.content.slice(0, 220),
                    tags: rawTags,
                    entryType: typeof meta.entryType === 'string' ? meta.entryType
                        : typeof meta.assetType === 'string' ? meta.assetType
                        : typeof meta.profileType === 'string' ? 'perfil'
                        : 'geral',
                    source: typeof meta.source === 'string' ? meta.source : 'manual',
                    imageUrl: typeof meta.imageUrl === 'string' ? meta.imageUrl : undefined,
                }
            })
    } catch {
        return []
    }
}

export default async function KnowledgeBasePage() {
    const auth = await tryGetAuthContext()
    const entries = auth ? await loadAllEntries(auth.orgId) : []

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-5xl">
            <PageHeader
                category="IA & Automação"
                title="Base de Conhecimento"
                icon={BookOpen}
            />
            <KnowledgeTabs entries={entries} />
        </div>
    )
}

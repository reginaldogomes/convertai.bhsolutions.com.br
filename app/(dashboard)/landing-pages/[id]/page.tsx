import { notFound } from 'next/navigation'
import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { PageHeader } from '@/components/layout/PageHeader'
import { PublishButton } from '@/components/crm/PublishButton'
import { DeleteLandingPageButton } from '@/components/crm/DeleteLandingPageButton'
import { AddKnowledgeBaseButton } from '@/components/crm/AddKnowledgeBaseButton'
import dynamic from 'next/dynamic'
import { Globe, Eye, MessageSquare, Users, MousePointer } from 'lucide-react'

const SectionManager = dynamic(() => import('@/components/crm/SectionManager').then(m => m.SectionManager), {
    loading: () => <div className="h-64 animate-pulse bg-secondary rounded-(--radius)" />,
})

const LandingPageEditor = dynamic(() => import('./landing-page-editor').then(m => m.LandingPageEditor), {
    loading: () => <div className="h-96 animate-pulse bg-secondary rounded-(--radius)" />,
})

import { SyncProductKnowledgeButton } from '@/components/crm/SyncProductKnowledgeButton'

export default async function LandingPageDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const auth = await tryGetAuthContext()
    if (!auth) notFound()

    const [pageResult, knowledgeBase, analytics] = await Promise.all([
        useCases.getLandingPage().execute(auth.orgId, id),
        useCases.listKnowledgeBase().execute(auth.orgId, id),
        useCases.getLandingPageAnalytics().execute(id),
    ])

    if (!pageResult.ok) notFound()
    const page = pageResult.value

    // Fetch linked product for AI context enrichment
    let productContext: string | undefined
    if (page.productId) {
        const productResult = await useCases.getProduct().execute(auth.orgId, page.productId)
        if (productResult.ok) {
            productContext = productResult.value.toAIContext()
        }
    }

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                category="Landing Pages"
                title={page.name}
                icon={Globe}
                actions={
                    <div className="flex items-center gap-3">
                        <a
                            href={`/p/${page.slug}?preview=1`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                            Pré-visualizar
                        </a>
                        <PublishButton pageId={page.id} isPublished={page.isPublished()} />
                        <DeleteLandingPageButton pageId={page.id} pageName={page.name} redirectAfterDelete />
                    </div>
                }
            />

            {/* Analytics Cards */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Visualizações', value: analytics.totalViews, icon: Eye },
                    { label: 'Conversas', value: analytics.totalChatStarts, icon: MessageSquare },
                    { label: 'Leads Capturados', value: analytics.totalLeads, icon: Users },
                    { label: 'Cliques no CTA', value: analytics.totalCtaClicks, icon: MousePointer },
                ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="bg-[hsl(var(--card))] border border-border rounded-(--radius) p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <p className="text-muted-foreground text-xs uppercase tracking-wider">{label}</p>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{value}</p>
                    </div>
                ))}
            </div>

            {/* Section Builder */}
            <div className="bg-[hsl(var(--card))] border border-border rounded-(--radius) p-6">
                <SectionManager
                    pageId={page.id}
                    initialSections={page.configJson.sections ?? []}
                    pageContext={{
                        name: page.name,
                        headline: page.headline,
                        subheadline: page.subheadline,
                        productContext,
                    }}
                />
            </div>

            {/* Editor */}
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div className="bg-[hsl(var(--card))] border border-border rounded-(--radius) p-6">
                        <h2 className="text-lg font-bold mb-4">Configurações da Página</h2>
                        <LandingPageEditor page={{
                            id: page.id,
                            name: page.name,
                            slug: page.slug,
                            headline: page.headline,
                            subheadline: page.subheadline,
                            ctaText: page.ctaText,
                            chatbotName: page.chatbotName,
                            chatbotWelcomeMessage: page.chatbotWelcomeMessage,
                            chatbotSystemPrompt: page.chatbotSystemPrompt,
                            theme: page.configJson.theme,
                            primaryColor: page.configJson.primaryColor,
                            designSystem: page.configJson.designSystem,
                        }} />
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Knowledge Base */}
                    <div className="bg-[hsl(var(--card))] border border-border rounded-(--radius) p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">Base de Conhecimento (RAG)</h2>
                            <div className="flex items-center gap-2">
                                {page.productId && <SyncProductKnowledgeButton pageId={page.id} />}
                                <AddKnowledgeBaseButton landingPageId={page.id} />
                            </div>
                        </div>
                        {knowledgeBase.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground text-sm">Nenhum conteúdo adicionado.</p>
                                <p className="text-muted-foreground/60 text-xs mt-1">
                                    Adicione informações sobre seu produto para o chatbot responder.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {knowledgeBase.map((kb) => (
                                    <div key={kb.id} className="p-3 bg-[hsl(var(--background-secondary))] rounded-(--radius) border border-border-subtle">
                                        <p className="font-medium text-sm">{kb.title}</p>
                                        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{kb.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="bg-[hsl(var(--card))] border border-border rounded-(--radius) p-6">
                        <h2 className="text-lg font-bold mb-2">Informações</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <span className="font-medium">{page.status}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">URL</span>
                                <span className="font-mono text-xs">/p/{page.slug}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Bot</span>
                                <span>{page.chatbotName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Criado</span>
                                <span>{new Date(page.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

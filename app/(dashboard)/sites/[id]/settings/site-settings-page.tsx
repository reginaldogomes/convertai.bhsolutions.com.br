'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useActionState } from 'react'
import Link from 'next/link'
import { Globe, Settings, Layers, Puzzle, Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react'
import { updateSite } from '@/actions/sites'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InlineNotice } from '@/components/ui/inline-notice'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type SiteSettingsTab = 'general' | 'sections' | 'modules' | 'rag' | 'custom-domains'

interface PlainSite {
    id: string
    name: string
    createdAt: string
}

interface SiteSettingsPageProps {
    initialSite: PlainSite
    defaultTab?: string
}

const tabItems: Array<{ key: SiteSettingsTab; label: string; icon: ReactNode }> = [
    { key: 'general', label: 'Geral', icon: <Settings className="w-4 h-4" /> },
    { key: 'sections', label: 'Seções', icon: <Layers className="w-4 h-4" /> },
    { key: 'modules', label: 'Módulos', icon: <Puzzle className="w-4 h-4" /> },
    { key: 'rag', label: 'Sugestões IA', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'custom-domains', label: 'Domínios', icon: <ShieldCheck className="w-4 h-4" /> },
]

const defaultModules = {
    chatbot: true,
    analytics: true,
    seo: false,
    integrations: false,
}

export function SiteSettingsPage({ initialSite, defaultTab }: SiteSettingsPageProps) {
    const [tab, setTab] = useState<SiteSettingsTab>('general')
    const [siteName, setSiteName] = useState(initialSite.name)
    const [modules, setModules] = useState(defaultModules)
    const [suggestionPrompt, setSuggestionPrompt] = useState('')
    const [suggestion, setSuggestion] = useState<string | null>(null)
    const [state, action, pending] = useActionState(updateSite, { error: '', success: false })

    useEffect(() => {
        if (defaultTab && ['general', 'sections', 'modules', 'rag', 'custom-domains'].includes(defaultTab)) {
            setTab(defaultTab as SiteSettingsTab)
        }
    }, [defaultTab])

    const toggleModule = (key: keyof typeof modules) => {
        setModules((current) => ({ ...current, [key]: !current[key] }))
    }

    const handleGenerateSuggestion = () => {
        setSuggestion(
            'A IA RAG irá sugerir uma seção relevante com base em seus dados e configurações do site. Aqui você poderá gerar um hero poderoso, features adaptadas ao seu negócio e conteúdo SEO-friendly.'
        )
    }

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                category="Sites"
                title={`Configurar ${initialSite.name}`}
                icon={Globe}
                actions={
                    <Link href="/sites" className="text-sm font-bold text-primary hover:underline">
                        <ArrowLeft className="w-4 h-4 inline-block mr-1" /> Voltar para Sites
                    </Link>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-6">
                <aside className="space-y-3 rounded-(--radius) border border-border bg-card p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground font-bold">Configuração do Site</p>
                    <div className="space-y-2">
                        {tabItems.map((item) => (
                            <button
                                type="button"
                                key={item.key}
                                onClick={() => setTab(item.key)}
                                className={`flex w-full items-center gap-3 rounded-(--radius) px-3 py-3 text-left text-sm font-medium transition ${
                                    tab === item.key ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/70'
                                }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </aside>

                <section className="space-y-6">
                    {tab === 'general' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Configurações Gerais</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Atualize o nome do site e as informações básicas da organização.
                                </p>

                                {state.error && <InlineNotice variant="destructive" message={state.error} size="sm" />}
                                {state.success && <InlineNotice variant="success" message="Nome do site atualizado com sucesso." size="sm" />}

                                <form action={action} className="space-y-4">
                                    <input type="hidden" name="siteId" value={initialSite.id} />
                                    <div>
                                        <Label htmlFor="site-name" className="text-foreground-secondary text-xs uppercase tracking-wider">
                                            Nome do Site
                                        </Label>
                                        <Input
                                            id="site-name"
                                            name="name"
                                            value={siteName}
                                            onChange={(event) => setSiteName(event.target.value)}
                                            className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9 mt-1"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-foreground-secondary text-xs uppercase tracking-wider">
                                                ID do Site
                                            </Label>
                                            <div className="rounded-(--radius) border border-border bg-[hsl(var(--background-tertiary))] px-3 py-2 text-sm text-foreground-secondary break-all">
                                                {initialSite.id}
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-foreground-secondary text-xs uppercase tracking-wider">
                                                Criado em
                                            </Label>
                                            <div className="rounded-(--radius) border border-border bg-[hsl(var(--background-tertiary))] px-3 py-2 text-sm text-foreground-secondary">
                                                {new Date(initialSite.createdAt).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>
                                    </div>

                                    <Button type="submit" className="h-9 px-5 text-xs font-bold uppercase tracking-wider">
                                        Salvar Alterações
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {tab === 'sections' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Seções do Site</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Estruture seções como hero, features, depoimentos e formulário de contato. Em breve será possível gerar cada seção usando IA contextualizada.
                                </p>

                                <div className="grid gap-3 md:grid-cols-2">
                                    {['Hero', 'Features', 'Depoimentos', 'FAQ', 'Contato'].map((item) => (
                                        <div key={item} className="rounded-(--radius) border border-border p-4 bg-[hsl(var(--background-tertiary))]">
                                            <p className="font-semibold text-foreground">{item}</p>
                                            <p className="text-sm text-muted-foreground mt-1">Conteúdo dinâmico gerenciado por seção.</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 rounded-(--radius) border border-dashed border-border-subtle bg-secondary/50 p-4 text-sm text-foreground-secondary">
                                    <p className="font-medium">Modo dinâmico RAG</p>
                                    <p className="mt-2">Quando ativado, o sistema sugerirá novas seções e textos com base no conhecimento do seu site e da sua organização.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {tab === 'modules' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Módulos do Site</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Ative ou desative recursos como chatbot, analytics, SEO e integrações externas.
                                </p>

                                <div className="grid gap-3">
                                    {(
                                        [
                                            { key: 'chatbot', label: 'Chatbot', description: 'Assistente conversacional para visitantes.' },
                                            { key: 'analytics', label: 'Analytics', description: 'Coleta eventos de visita e desempenho.' },
                                            { key: 'seo', label: 'SEO', description: 'Configurações de meta tags e conteúdo otimizável.' },
                                            { key: 'integrations', label: 'Integrações', description: 'Conectar WhatsApp, email ou outros sistemas.' },
                                        ] as const
                                    ).map((module) => (
                                        <div key={module.key} className="flex items-center justify-between rounded-(--radius) border border-border p-4">
                                            <div>
                                                <p className="font-medium text-foreground">{module.label}</p>
                                                <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant={modules[module.key] ? 'secondary' : 'outline'}
                                                size="sm"
                                                onClick={() => toggleModule(module.key)}
                                            >
                                                {modules[module.key] ? 'Ativado' : 'Desativar'}
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 rounded-(--radius) border border-dashed border-border-subtle bg-secondary/50 p-4 text-sm text-foreground-secondary">
                                    <p className="font-medium">Observação</p>
                                    <p className="mt-2">As configurações de módulos serão persistidas na próxima etapa de integração do backend.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {tab === 'rag' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Sugestões com IA</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Use RAG para gerar sugestões de conteúdo e seções com base no contexto do seu site.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="suggestion-prompt" className="text-foreground-secondary text-xs uppercase tracking-wider">
                                            Descreva o propósito do site
                                        </Label>
                                        <textarea
                                            id="suggestion-prompt"
                                            value={suggestionPrompt}
                                            onChange={(event) => setSuggestionPrompt(event.target.value)}
                                            className="w-full min-h-30 rounded-(--radius) border border-border bg-[hsl(var(--background-tertiary))] p-3 text-sm text-foreground"
                                            placeholder="Por exemplo: site para vendas de software de produtividade..."
                                        />
                                    </div>

                                    <Button type="button" variant="secondary" className="h-9 px-5 text-xs font-bold uppercase tracking-wider" onClick={handleGenerateSuggestion}>
                                        Gerar Sugestão
                                    </Button>

                                    {suggestion && (
                                        <div className="rounded-(--radius) border border-border p-4 bg-card">
                                            <p className="font-semibold text-foreground">Sugestão gerada</p>
                                            <p className="mt-2 text-sm text-muted-foreground">{suggestion}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {tab === 'custom-domains' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Domínios Personalizados</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Gerencie domínios personalizados ligados ao seu site e use-os para publicar as landing pages do site.
                                </p>
                                <div className="rounded-(--radius) border border-border p-4 bg-[hsl(var(--background-tertiary))] text-sm text-foreground-secondary">
                                    No momento, o gerenciamento de domínios é feito nas configurações globais do painel.
                                </div>
                                <Link href="/settings" className="inline-flex items-center gap-2 rounded-(--radius) border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10">
                                    <Globe className="w-4 h-4" /> Abrir Configurações
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </section>
            </div>
        </div>
    )
}

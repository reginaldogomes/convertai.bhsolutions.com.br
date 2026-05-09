'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useActionState } from 'react'
import Link from 'next/link'
import { Globe, Settings, Layers, Puzzle, Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react'
import { updateSite, deleteSite } from '@/actions/sites'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InlineNotice } from '@/components/ui/inline-notice'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { DangerConfirmationHeader } from '@/components/ui/danger-confirmation-header'


type SiteSettingsTab = 'general' | 'sections' | 'modules' | 'rag' | 'custom-domains'

interface PlainSite {
    id: string
    name: string
    configJson?: Record<string, any>
    primaryColor?: string | null
    logoUrl?: string | null
    description?: string | null
    theme?: string | null
    status?: string | null
    createdAt: string
}

interface PlainPage {
    id: string
    name: string
    slug: string
    status: string
    isHomepage: boolean
}

interface SiteSettingsPageProps {
    initialSite: PlainSite
    initialPages: PlainPage[]
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

export function SiteSettingsPage({ initialSite, initialPages, defaultTab }: SiteSettingsPageProps) {
    const [tab, setTab] = useState<SiteSettingsTab>('general')
    const [siteName, setSiteName] = useState(initialSite.name)
    const [modules, setModules] = useState(() => {
        return {
            ...defaultModules,
            ...(initialSite.configJson?.modules || {})
        }
    })
    const [suggestionPrompt, setSuggestionPrompt] = useState('')
    const [suggestion, setSuggestion] = useState<string | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [state, action] = useActionState(updateSite, { error: '', success: false })
    const [moduleState, moduleAction] = useActionState(updateSite, { error: '', success: false })
    const [deleteState, deleteAction, isDeleting] = useActionState(deleteSite, { error: '', success: false })

    useEffect(() => {
        if (defaultTab && ['general', 'sections', 'modules', 'rag', 'custom-domains'].includes(defaultTab)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
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
                                                Tema Base
                                            </Label>
                                            <div className="rounded-(--radius) border border-border bg-[hsl(var(--background-tertiary))] px-3 py-2 text-sm text-foreground-secondary">
                                                {initialSite.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-foreground-secondary text-xs uppercase tracking-wider">
                                                Status
                                            </Label>
                                            <div className="rounded-(--radius) border border-border bg-[hsl(var(--background-tertiary))] px-3 py-2 text-sm text-foreground-secondary">
                                                {initialSite.status === 'published' ? 'Publicado' : 'Rascunho'}
                                            </div>
                                        </div>
                                    </div>

                                    {initialSite.configJson && Object.keys(initialSite.configJson).length > 0 && (
                                        <div className="mt-6 space-y-4 pt-6 border-t border-border">
                                            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Configurações Base geradas por IA</p>
                                            
                                            {initialSite.configJson.seo && (
                                                <div className="rounded-(--radius) border border-border p-4 bg-card">
                                                    <p className="font-semibold text-foreground text-sm">SEO Principal</p>
                                                    <p className="text-sm mt-1">{initialSite.configJson.seo.title}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">{initialSite.configJson.seo.description}</p>
                                                </div>
                                            )}

                                            {initialSite.configJson.pages && Array.isArray(initialSite.configJson.pages) && (
                                                <div className="rounded-(--radius) border border-border p-4 bg-card">
                                                    <p className="font-semibold text-foreground text-sm">Páginas Sugeridas</p>
                                                    <ul className="list-disc list-inside text-xs text-muted-foreground mt-2">
                                                        {initialSite.configJson.pages.map((p: string, i: number) => (
                                                            <li key={i}>{p}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <Button type="submit" className="h-9 px-5 text-xs font-bold uppercase tracking-wider mt-6">
                                        Salvar Alterações
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {tab === 'general' && (
                        <Card className="border-destructive/20 mt-6">
                            <CardHeader>
                                <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                                <CardDescription>Ações destrutivas para este site.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {deleteState.error && <InlineNotice variant="destructive" message={deleteState.error} size="sm" className="mb-4" />}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border p-4 bg-background">
                                    <div>
                                        <p className="font-semibold text-foreground text-sm">Excluir Site</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            A exclusão do site removerá permanentemente as configurações, páginas e a base de conhecimento (RAG) associada a ele.
                                        </p>
                                    </div>
                                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                                Excluir Site
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader className="mb-4">
                                                <DialogTitle className="hidden">Excluir Site</DialogTitle>
                                                <DangerConfirmationHeader 
                                                    title="Excluir Site Definitivamente?" 
                                                    subtitle="Esta ação não pode ser desfeita e removerá todo o conteúdo deste site."
                                                />
                                            </DialogHeader>
                                            <div className="text-sm text-muted-foreground mb-4">
                                                <p>Ao confirmar, o site <strong>{initialSite.name}</strong> será apagado do banco de dados.</p>
                                                <ul className="list-disc list-inside mt-2 space-y-1">
                                                    <li>A base de conhecimento vetorial (RAG) do site será destruída.</li>
                                                    <li>Todas as configurações de módulos serão perdidas.</li>
                                                    <li>As landing pages vinculadas deixarão de funcionar se não forem reatribuídas.</li>
                                                </ul>
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="outline" type="button" disabled={isDeleting}>
                                                        Cancelar
                                                    </Button>
                                                </DialogClose>
                                                <form action={deleteAction} onSubmit={() => setIsDeleteDialogOpen(false)}>
                                                    <input type="hidden" name="siteId" value={initialSite.id} />
                                                    <Button type="submit" variant="destructive" disabled={isDeleting}>
                                                        {isDeleting ? 'Excluindo...' : 'Sim, excluir site'}
                                                    </Button>
                                                </form>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {tab === 'sections' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Páginas e Seções</CardTitle>
                                <CardDescription>Gerencie as páginas que compõem este site.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {initialPages.map((page) => (
                                        <div key={page.id} className="flex items-center justify-between rounded-(--radius) border border-border p-4 bg-card">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-foreground">{page.name}</p>
                                                    {page.isHomepage && (
                                                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">Home</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">/p/{page.slug}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                                    page.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                                                }`}>
                                                    {page.status === 'published' ? 'Publicado' : 'Rascunho'}
                                                </span>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/editor/${page.id}`}>Editar</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    <Button variant="outline" className="w-full border-dashed" asChild>
                                        <Link href={`/sites/${initialSite.id}/pages/new`}>+ Adicionar Nova Página</Link>
                                    </Button>
                                </div>

                                <div className="mt-6 rounded-(--radius) border border-dashed border-border-subtle bg-secondary/50 p-4 text-sm text-foreground-secondary">
                                    <p className="font-medium flex items-center gap-2">
                                        <Sparkles className="size-4 text-primary" />
                                        Modo dinâmico RAG
                                    </p>
                                    <p className="mt-2 text-xs">O sistema utiliza sua base de conhecimento para sugerir melhorias no conteúdo destas páginas automaticamente.</p>
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

                                {moduleState.error && <InlineNotice variant="destructive" message={moduleState.error} size="sm" className="mb-4" />}
                                {moduleState.success && <InlineNotice variant="success" message="Módulos atualizados com sucesso." size="sm" className="mb-4" />}

                                <form action={moduleAction} className="space-y-4">
                                    <input type="hidden" name="siteId" value={initialSite.id} />
                                    <input type="hidden" name="name" value={siteName} />
                                    <input 
                                        type="hidden" 
                                        name="configJson" 
                                        value={JSON.stringify({
                                            ...initialSite.configJson,
                                            modules
                                        })} 
                                    />

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
                                                    {modules[module.key] ? 'Ativado' : 'Ativar'}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>

                                    <Button type="submit" className="h-9 px-5 text-xs font-bold uppercase tracking-wider mt-6">
                                        Salvar Módulos
                                    </Button>
                                </form>
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

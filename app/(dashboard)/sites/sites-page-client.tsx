'use client'

import { useActionState, useEffect, useState } from 'react'
import { Globe, Settings, Link, ExternalLink, CheckCircle, Clock } from 'lucide-react'
import { createSite, generateSitePlan, publishSite } from '@/actions/sites'
import { PageHeader } from '@/components/layout/PageHeader'
import { InlineNotice } from '@/components/ui/inline-notice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

// Plain object type for client component (não pode usar instâncias de classe)
interface PlainSite {
    id: string
    name: string
    createdAt: string // ISO string
    publicUrl?: string | null
    defaultUrl?: string // URL padrão gerada pelo sistema
    status?: string
}

interface SitePlan {
    suggestedName: string
    previewPath: string
    seoTitle: string
    seoDescription: string
    keywords: string[]
    pages: string[]
    modules: string[]
    performanceTips: string
    premiumDesign: string
    testUrlHint: string
    sections?: Record<string, unknown>
}

interface SitesPageClientProps {
    initialSites: PlainSite[]
    initialError: string | null
}

export function SitesPageClient({ initialSites, initialError }: SitesPageClientProps) {
    const [state, action, pending] = useActionState(createSite, { error: '' })
    
    // UI States para Geração em Streaming
    const [streamingPlan, setStreamingPlan] = useState<Partial<SitePlan> | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [planError, setPlanError] = useState('')

    const [siteName, setSiteName] = useState('')
    const [seoTitle, setSeoTitle] = useState('')
    const [seoDescription, setSeoDescription] = useState('')
    const [selectedPages, setSelectedPages] = useState<string[]>([])
    const [selectedModules, setSelectedModules] = useState({
        chatbot: true,
        analytics: true,
        seo: true,
        integrations: false
    })
    const router = useRouter()

    useEffect(() => {
        if (streamingPlan?.suggestedName && !siteName) {
            setSiteName(streamingPlan.suggestedName)
        }
    }, [streamingPlan, siteName])

    async function handleGeneratePlan(formData: FormData) {
        setIsGenerating(true)
        setPlanError('')
        setStreamingPlan(null)

        try {
            const { error, plan } = await generateSitePlan(formData)
            
            if (error) {
                setPlanError(error)
            } else if (plan) {
                setStreamingPlan(plan)
                setSiteName(plan.suggestedName || '')
                setSeoTitle(plan.seoTitle || '')
                setSeoDescription(plan.seoDescription || '')
                setSelectedPages(plan.pages || [])
            }
        } catch (error: any) {
            setPlanError(error.message || 'Falha ao gerar plano.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleViewCustomDomains = (siteId: string | undefined) => {
        if (!siteId || siteId === 'undefined') {
            return
        }

        router.push(`/sites/${siteId}/settings?tab=custom-domains`)
    }

    const handleOpenSite = (publicUrl?: string | null, defaultUrl?: string) => {
        const urlToOpen = publicUrl || defaultUrl
        if (!urlToOpen) {
            return
        }

        window.open(urlToOpen, '_blank', 'noopener')
    }

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                category="Sites"
                title="Gerenciar Site"
                icon={Globe}
            />

            {initialError && (
                <InlineNotice variant="destructive" message={initialError} className="mb-4" size="sm" />
            )}

            {state.error && (
                <InlineNotice variant="destructive" message={state.error} className="mb-4" size="sm" />
            )}


            <div className="grid gap-6 md:grid-cols-2">
                {/* Site Atual */}
                <Card>
                    <CardHeader>
                        <CardTitle>Site da Organização</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Cada organização pode ter apenas um site ativo
                        </p>
                    </CardHeader>
                    <CardContent>
                        {initialSites.length === 0 ? (
                            <div className="text-center py-8">
                                <Globe className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                                <p className="text-muted-foreground">Nenhum site criado ainda.</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Crie seu site para começar a gerar landing pages.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {initialSites.map((site) => (
                                    <div key={site.id} className="flex items-center justify-between p-4 border rounded-lg bg-linear-to-r from-primary/5 to-primary/10 border-primary/20">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                                                <Globe className="w-5 h-5 text-primary-foreground" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-foreground">{site.name}</p>
                                                    {site.status === 'published' ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-500">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Publicado
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-500">
                                                            <Clock className="w-3 h-3" />
                                                            Rascunho
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Criado em {new Date(site.createdAt).toLocaleDateString('pt-BR')}
                                                </p>
                                                {site.publicUrl ? (
                                                    <p className="text-sm text-foreground-secondary mt-1 break-all">
                                                        Site público: {site.publicUrl}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Nenhum domínio público ativo.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {site.status === 'draft' && (
                                                <form action={publishSite}>
                                                    <input type="hidden" name="siteId" value={site.id} />
                                                    <Button
                                                        type="submit"
                                                        variant="default"
                                                        size="sm"
                                                        className="h-8 bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Publicar
                                                    </Button>
                                                </form>
                                            )}
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-8"
                                                onClick={() => handleOpenSite(site.publicUrl, site.defaultUrl)}
                                            >
                                                <ExternalLink className="w-4 h-4 mr-1" />
                                                Acessar site
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8"
                                                onClick={() => handleViewCustomDomains(site.id)}
                                            >
                                                <Settings className="w-4 h-4 mr-1" />
                                                Configurar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Ações do Site */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {initialSites.length === 0 ? 'Criar Site' : 'Gerenciar Site'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {initialSites.length === 0
                                ? 'Configure o site principal da sua organização'
                                : 'Gerencie as configurações do seu site'
                            }
                        </p>
                    </CardHeader>
                    {initialSites.length === 0 ? (
                        <CardContent>
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Gerar site com IA</CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Use a base de conhecimento com RAG para gerar nome, SEO, estrutura multipage, módulos e design.
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        {planError && (
                                            <InlineNotice variant="destructive" message={planError} className="mb-4" size="sm" />
                                        )}

                                        <form action={handleGeneratePlan} className="space-y-4">
                                            <div>
                                                <Label htmlFor="brandName" className="text-foreground-secondary text-xs uppercase tracking-wider">
                                                    Nome da Marca (opcional)
                                                </Label>
                                                <Input
                                                    id="brandName"
                                                    name="brandName"
                                                    type="text"
                                                    className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9 mt-1"
                                                    placeholder="Ex: BHS Soluções"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="businessDescription" className="text-foreground-secondary text-xs uppercase tracking-wider">
                                                    Descrição do negócio
                                                </Label>
                                                <textarea
                                                    id="businessDescription"
                                                    name="businessDescription"
                                                    rows={4}
                                                    className="w-full rounded-(--radius) border border-border bg-[hsl(var(--background-tertiary))] p-3 text-sm text-foreground"
                                                    placeholder="Descreva o que sua empresa faz, público, diferenciais e objetivo do site..."
                                                />
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div>
                                                    <Label htmlFor="targetAudience" className="text-foreground-secondary text-xs uppercase tracking-wider">
                                                        Público-alvo
                                                    </Label>
                                                    <Input
                                                        id="targetAudience"
                                                        name="targetAudience"
                                                        type="text"
                                                        className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9 mt-1"
                                                        placeholder="Ex: microempresas de serviços"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="niche" className="text-foreground-secondary text-xs uppercase tracking-wider">
                                                        Nicho
                                                    </Label>
                                                    <Input
                                                        id="niche"
                                                        name="niche"
                                                        type="text"
                                                        className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9 mt-1"
                                                        placeholder="Ex: automação de marketing"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label htmlFor="locale" className="text-foreground-secondary text-xs uppercase tracking-wider">
                                                    Localidade
                                                </Label>
                                                <Input
                                                    id="locale"
                                                    name="locale"
                                                    type="text"
                                                    className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9 mt-1"
                                                    placeholder="Ex: Brasil"
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                disabled={isGenerating}
                                                className="h-9 px-5 text-xs font-bold uppercase tracking-wider gap-2 w-full"
                                            >
                                                {isGenerating ? 'Analisando e Gerando...' : 'Gerar Estrutura com IA'}
                                            </Button>
                                        </form>

                                        {streamingPlan && (
                                            <div className="mt-8 pt-6 border-t border-border">
                                                <div className="flex items-center gap-2 mb-4 text-primary">
                                                    <Globe className="size-4 animate-pulse" />
                                                    <h3 className="font-bold text-sm uppercase tracking-widest">Plano Sugerido pela IA</h3>
                                                </div>

                                                 <div className="space-y-4">
                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] text-muted-foreground uppercase font-bold">SEO Title</Label>
                                                            <Input 
                                                                value={seoTitle} 
                                                                onChange={(e) => setSeoTitle(e.target.value)}
                                                                className="h-9 bg-background/50 text-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] text-muted-foreground uppercase font-bold">SEO Description</Label>
                                                            <Input 
                                                                value={seoDescription} 
                                                                onChange={(e) => setSeoDescription(e.target.value)}
                                                                className="h-9 bg-background/50 text-sm"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="p-3 rounded-lg border border-border bg-background/50">
                                                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2">Estrutura de Páginas</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedPages.map((page, i) => (
                                                                <div key={i} className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold group">
                                                                    {page}
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => setSelectedPages(prev => prev.filter((_, idx) => idx !== i))}
                                                                        className="hover:text-destructive transition-colors"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button 
                                                                type="button"
                                                                onClick={() => {
                                                                    const p = prompt('Nome da nova página:')
                                                                    if (p) setSelectedPages(prev => [...prev, p])
                                                                }}
                                                                className="px-2 py-1 rounded border border-dashed border-border hover:border-primary text-[10px] font-bold transition-colors"
                                                            >
                                                                + Adicionar
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="p-3 rounded-lg border border-border bg-background/50">
                                                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-3">Módulos Ativos</p>
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                            {(Object.keys(selectedModules) as Array<keyof typeof selectedModules>).map((mod) => (
                                                                <button
                                                                    key={mod}
                                                                    type="button"
                                                                    onClick={() => setSelectedModules(prev => ({ ...prev, [mod]: !prev[mod] }))}
                                                                    className={`flex items-center justify-center px-3 py-2 rounded-md text-[10px] font-bold uppercase transition-all border ${
                                                                        selectedModules[mod] 
                                                                            ? 'bg-primary text-primary-foreground border-primary' 
                                                                            : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                                                                    }`}
                                                                >
                                                                    {mod}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="p-3 rounded-lg border border-border bg-background/50">
                                                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Diretriz Criativa (IA)</p>
                                                        <p className="italic text-muted-foreground text-xs">{streamingPlan.premiumDesign || '...'}</p>
                                                    </div>
                                                </div>

                                                <form action={action} className="mt-6 p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                                                    <input 
                                                        type="hidden" 
                                                        name="planJson" 
                                                        value={JSON.stringify({
                                                            ...streamingPlan,
                                                            suggestedName: siteName,
                                                            seoTitle,
                                                            seoDescription,
                                                            pages: selectedPages,
                                                            modules: selectedModules
                                                        })} 
                                                    />
                                                    <Label htmlFor="finalName" className="text-xs font-bold uppercase mb-2 block">
                                                        Confirmar Nome do Site
                                                    </Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            id="finalName"
                                                            name="name"
                                                            value={siteName}
                                                            onChange={(e) => setSiteName(e.target.value)}
                                                            placeholder="Nome final do site"
                                                            className="bg-background border-border h-10"
                                                            required
                                                        />
                                                        <Button type="submit" disabled={pending || isGenerating} className="h-10 px-6 font-bold uppercase tracking-wider">
                                                            {pending ? 'Criando...' : 'Finalizar e Criar'}
                                                        </Button>
                                                    </div>
                                                    {state.error && <InlineNotice variant="destructive" message={state.error} className="mt-2" size="sm" />}
                                                </form>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    ) : (
                        <CardContent>
                            <div className="space-y-4">
                                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                                                Política de Site Único
                                            </h4>
                                            <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                                                Cada organização pode ter apenas um site ativo. Para criar um novo site,
                                                primeiro exclua o site atual através do botão &ldquo;Configurar&rdquo;.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Button
                                        variant="outline"
                                        className="justify-start h-9"
                                        onClick={() => handleViewCustomDomains(initialSites[0].id)}
                                    >
                                        <Link className="w-4 h-4 mr-2" />
                                        Domínios Personalizados
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
    )
}
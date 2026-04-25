'use client'

import { useActionState, useEffect, useState } from 'react'
import { Globe, Settings, FileText, Link } from 'lucide-react'
import { createSite, generateSitePlan, updateSite, deleteSite } from '@/actions/sites'
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
}

interface SitesPageClientProps {
    initialSites: PlainSite[]
    initialError: string | null
}

export function SitesPageClient({ initialSites, initialError }: SitesPageClientProps) {
    const [state, action, pending] = useActionState(createSite, { error: '' })
    const [planState, planAction, planPending] = useActionState(generateSitePlan, { error: '', plan: null as SitePlan | null })
    const [siteName, setSiteName] = useState('')
    const [updateState, setUpdateState] = useState({ error: '', success: false })
    const [deleteState, setDeleteState] = useState({ error: '', success: false })
    const router = useRouter()

    useEffect(() => {
        if (planState.plan?.suggestedName && !siteName) {
            setSiteName(planState.plan.suggestedName)
        }
    }, [planState.plan, siteName])

    const handleViewLandingPages = (siteId: string | undefined) => {
        if (!siteId || siteId === 'undefined') {
            return
        }

        router.push(`/sites/${siteId}/pages`)
    }

    const handleViewCustomDomains = (siteId: string | undefined) => {
        if (!siteId || siteId === 'undefined') {
            return
        }

        router.push(`/sites/${siteId}/settings?tab=custom-domains`)
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

            {updateState.error && (
                <InlineNotice variant="destructive" message={updateState.error} className="mb-4" size="sm" />
            )}

            {updateState.success && (
                <InlineNotice variant="success" message="Site atualizado com sucesso!" className="mb-4" size="sm" />
            )}

            {deleteState.success && (
                <InlineNotice variant="success" message="Site deletado com sucesso!" className="mb-4" size="sm" />
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
                                                <p className="font-medium text-foreground">{site.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Criado em {new Date(site.createdAt).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
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
                                        {planState.error && (
                                            <InlineNotice variant="destructive" message={planState.error} className="mb-4" size="sm" />
                                        )}

                                        <form action={planAction} className="space-y-4">
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
                                                disabled={planPending}
                                                className="h-9 px-5 text-xs font-bold uppercase tracking-wider gap-2 w-full"
                                            >
                                                {planPending ? 'Gerando plano...' : 'Gerar plano de site'}
                                            </Button>
                                        </form>

                                        {planState.plan && (
                                            <div className="mt-6 space-y-4">
                                                <div className="rounded-(--radius) border border-border bg-[hsl(var(--background-tertiary))] p-4">
                                                    <p className="text-sm text-muted-foreground mb-3">Plano gerado por IA</p>
                                                    <p className="font-semibold text-foreground">Nome recomendado</p>
                                                    <p className="text-sm text-foreground mb-3">{planState.plan.suggestedName}</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-9"
                                                        onClick={() => setSiteName(planState.plan?.suggestedName ?? '')}
                                                    >
                                                        Usar nome sugerido
                                                    </Button>
                                                </div>

                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="rounded-(--radius) border border-border bg-[hsl(var(--background-tertiary))] p-4">
                                                        <p className="text-sm text-muted-foreground mb-2">SEO</p>
                                                        <p className="font-semibold text-foreground">{planState.plan.seoTitle}</p>
                                                        <p className="text-sm text-muted-foreground mt-2">{planState.plan.seoDescription}</p>
                                                    </div>
                                                    <div className="rounded-(--radius) border border-border bg-[hsl(var(--background-tertiary))] p-4">
                                                        <p className="text-sm text-muted-foreground mb-2">URL de Teste</p>
                                                        <p className="text-sm text-foreground">{planState.plan.previewPath}</p>
                                                        <p className="text-xs text-muted-foreground mt-2">{planState.plan.testUrlHint}</p>
                                                    </div>
                                                </div>

                                                <div className="rounded-(--radius) border border-border bg-[hsl(var(--background-tertiary))] p-4">
                                                    <p className="text-sm text-muted-foreground mb-2">Páginas sugeridas</p>
                                                    <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                                                        {planState.plan.pages.map((page, index) => (
                                                            <li key={index}>{page}</li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="rounded-(--radius) border border-border bg-[hsl(var(--background-tertiary))] p-4">
                                                        <p className="text-sm text-muted-foreground mb-2">Módulos recomendados</p>
                                                        <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                                                            {planState.plan.modules.map((module, index) => (
                                                                <li key={index}>{module}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className="rounded-(--radius) border border-border bg-[hsl(var(--background-tertiary))] p-4">
                                                        <p className="text-sm text-muted-foreground mb-2">Design premium</p>
                                                        <p className="text-sm text-foreground">{planState.plan.premiumDesign}</p>
                                                    </div>
                                                </div>

                                                <div className="rounded-(--radius) border border-border bg-[hsl(var(--background-tertiary))] p-4">
                                                    <p className="text-sm text-muted-foreground mb-2">Performance</p>
                                                    <p className="text-sm text-foreground">{planState.plan.performanceTips}</p>
                                                </div>

                                                <div className="rounded-(--radius) border border-border bg-[hsl(var(--background-tertiary))] p-4">
                                                    <p className="text-sm text-muted-foreground mb-2">Keywords recomendadas</p>
                                                    <p className="text-sm text-foreground">{planState.plan.keywords.join(', ')}</p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <form action={action} className="space-y-4">
                                    <div>
                                        <Label htmlFor="name" className="text-foreground-secondary text-xs uppercase tracking-wider">
                                            Nome do Site
                                        </Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            type="text"
                                            required
                                            value={siteName}
                                            onChange={(event) => setSiteName(event.target.value)}
                                            className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9 mt-1"
                                            placeholder="Ex: Minha Empresa"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={pending}
                                        className="h-9 px-5 text-xs font-bold uppercase tracking-wider gap-2 w-full"
                                    >
                                        {pending ? 'Criando...' : 'Criar Site'}
                                    </Button>
                                </form>
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
                                                primeiro exclua o site atual através do botão "Configurar".
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Button
                                        variant="outline"
                                        className="justify-start h-9"
                                        onClick={() => handleViewLandingPages(initialSites[0].id)}
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        Ver Landing Pages
                                    </Button>
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
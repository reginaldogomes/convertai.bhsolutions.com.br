'use client'

import { useEffect, useState, useCallback, type ReactNode } from 'react'
import { useActionState } from 'react'
import Link from 'next/link'
import {
    Globe, Settings, Layers, Puzzle, Sparkles, ShieldCheck, ArrowLeft,
    Palette, Navigation, Search, ChevronUp, ChevronDown, Monitor, Moon, Sun,
    Type, LayoutTemplate, Footprints, ExternalLink,
} from 'lucide-react'
import { updateSite, deleteSite } from '@/actions/sites'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InlineNotice } from '@/components/ui/inline-notice'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from '@/components/ui/dialog'
import { DangerConfirmationHeader } from '@/components/ui/danger-confirmation-header'
import { parseSiteConfig, type SiteConfig, type SiteNavStyle, type SiteFooterStyle } from '@/types/site-config'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type SiteSettingsTab = 'design' | 'navigation' | 'general' | 'pages' | 'seo' | 'modules' | 'custom-domains'

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
    { key: 'design', label: 'Design', icon: <Palette className="w-4 h-4" /> },
    { key: 'navigation', label: 'Navegação', icon: <Navigation className="w-4 h-4" /> },
    { key: 'general', label: 'Geral', icon: <Settings className="w-4 h-4" /> },
    { key: 'pages', label: 'Páginas', icon: <Layers className="w-4 h-4" /> },
    { key: 'seo', label: 'SEO', icon: <Search className="w-4 h-4" /> },
    { key: 'modules', label: 'Módulos', icon: <Puzzle className="w-4 h-4" /> },
    { key: 'custom-domains', label: 'Domínios', icon: <ShieldCheck className="w-4 h-4" /> },
]

// ─── Visual option cards ──────────────────────────────────────────────────────

function OptionCard({
    selected, onClick, label, description, preview,
}: {
    selected: boolean
    onClick: () => void
    label: string
    description?: string
    preview?: ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex flex-col gap-2 rounded-xl border-2 p-3 text-left transition-all cursor-pointer w-full',
                selected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40',
            )}
        >
            {preview && <div className="rounded-lg overflow-hidden">{preview}</div>}
            <div>
                <p className={cn('text-sm font-semibold', selected ? 'text-primary' : 'text-foreground')}>{label}</p>
                {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
            </div>
        </button>
    )
}

// ─── Nav style previews ───────────────────────────────────────────────────────

function NavPreview({ style }: { style: SiteNavStyle }) {
    if (style === 'transparent') {
        return (
            <div className="relative h-14 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 py-2">
                    <div className="h-2 w-12 rounded bg-white/80" />
                    <div className="flex gap-1.5">
                        <div className="h-1.5 w-8 rounded bg-white/60" />
                        <div className="h-1.5 w-8 rounded bg-white/60" />
                        <div className="h-4 w-10 rounded bg-white/90" />
                    </div>
                </div>
            </div>
        )
    }
    if (style === 'frosted') {
        return (
            <div className="relative h-14 rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 py-2 backdrop-blur-sm bg-white/70 border-b border-white/60">
                    <div className="h-2 w-12 rounded bg-slate-600" />
                    <div className="flex gap-1.5">
                        <div className="h-1.5 w-8 rounded bg-slate-400" />
                        <div className="h-1.5 w-8 rounded bg-slate-400" />
                        <div className="h-4 w-10 rounded bg-indigo-500" />
                    </div>
                </div>
            </div>
        )
    }
    return (
        <div className="relative h-14 rounded-lg overflow-hidden bg-slate-50">
            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 py-2 bg-white border-b border-slate-200 shadow-sm">
                <div className="h-2 w-12 rounded bg-slate-700" />
                <div className="flex gap-1.5">
                    <div className="h-1.5 w-8 rounded bg-slate-400" />
                    <div className="h-1.5 w-8 rounded bg-slate-400" />
                    <div className="h-4 w-10 rounded bg-indigo-500" />
                </div>
            </div>
        </div>
    )
}

// ─── Footer style previews ────────────────────────────────────────────────────

function FooterPreview({ style }: { style: SiteFooterStyle }) {
    if (style === 'minimal') {
        return (
            <div className="h-10 rounded-lg bg-slate-800 flex items-center justify-between px-3">
                <div className="h-1.5 w-14 rounded bg-white/40" />
                <div className="flex gap-1.5">
                    <div className="h-1.5 w-8 rounded bg-white/30" />
                    <div className="h-1.5 w-8 rounded bg-white/30" />
                </div>
                <div className="h-1.5 w-12 rounded bg-white/25" />
            </div>
        )
    }
    if (style === 'columns') {
        return (
            <div className="h-16 rounded-lg bg-slate-900 flex gap-2 p-2.5">
                <div className="flex-1 space-y-1">
                    <div className="h-1.5 w-12 rounded bg-white/60" />
                    <div className="h-1 w-16 rounded bg-white/30" />
                    <div className="flex gap-1 pt-0.5">
                        <div className="h-2 w-2 rounded-full bg-white/40" />
                        <div className="h-2 w-2 rounded-full bg-white/40" />
                        <div className="h-2 w-2 rounded-full bg-white/40" />
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="h-1 w-10 rounded bg-white/40" />
                    <div className="h-1 w-8 rounded bg-white/25" />
                    <div className="h-1 w-8 rounded bg-white/25" />
                </div>
                <div className="space-y-1">
                    <div className="h-1 w-10 rounded bg-white/40" />
                    <div className="h-1 w-8 rounded bg-white/25" />
                    <div className="h-1 w-8 rounded bg-white/25" />
                </div>
            </div>
        )
    }
    return (
        <div className="h-14 rounded-lg bg-slate-800 flex flex-col items-center justify-center gap-1 p-2">
            <div className="h-1.5 w-14 rounded bg-white/60" />
            <div className="h-1 w-20 rounded bg-white/30" />
            <div className="flex gap-1.5">
                <div className="h-1.5 w-8 rounded bg-white/25" />
                <div className="h-1.5 w-8 rounded bg-white/25" />
            </div>
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SiteSettingsPage({ initialSite, initialPages, defaultTab }: SiteSettingsPageProps) {
    const initialConfig = parseSiteConfig({
        ...initialSite.configJson,
        primaryColor: initialSite.primaryColor ?? initialSite.configJson?.primaryColor,
        theme: initialSite.theme ?? initialSite.configJson?.theme,
        logoUrl: initialSite.logoUrl ?? initialSite.configJson?.logoUrl,
    })

    // ── Tabs ────────────────────────────────────────────────────────────────
    const [tab, setTab] = useState<SiteSettingsTab>('design')
    useEffect(() => {
        const validTabs: SiteSettingsTab[] = ['design', 'navigation', 'general', 'pages', 'seo', 'modules', 'custom-domains']
        if (defaultTab && validTabs.includes(defaultTab as SiteSettingsTab)) {
            setTab(defaultTab as SiteSettingsTab)
        }
    }, [defaultTab])

    // ── General ─────────────────────────────────────────────────────────────
    const [siteName, setSiteName] = useState(initialSite.name)
    const [description, setDescription] = useState(initialSite.description ?? '')

    // ── Design ──────────────────────────────────────────────────────────────
    const [theme, setTheme] = useState<'light' | 'dark'>(initialConfig.theme)
    const [primaryColor, setPrimaryColor] = useState(initialConfig.primaryColor)
    const [logoUrl, setLogoUrl] = useState(initialConfig.logoUrl ?? '')
    const [navStyle, setNavStyle] = useState<SiteNavStyle>(initialConfig.nav.style)
    const [footerStyle, setFooterStyle] = useState<SiteFooterStyle>(initialConfig.footer.style)
    const [fontFamily, setFontFamily] = useState(initialConfig.designSystem?.fontFamily ?? 'inter')
    const [borderRadius, setBorderRadius] = useState(initialConfig.designSystem?.borderRadius ?? 'md')

    // ── Navigation ──────────────────────────────────────────────────────────
    const [navCtaText, setNavCtaText] = useState(initialConfig.nav.ctaText)
    const [navCtaUrl, setNavCtaUrl] = useState(initialConfig.nav.ctaUrl)
    const [showCta, setShowCta] = useState(initialConfig.nav.showCta)

    const [pageOrder, setPageOrder] = useState<Array<PlainPage & { navLabel: string; order: number }>>(() =>
        initialPages.map((p) => {
            const meta = initialConfig.pages.find((m) => m.id === p.id)
            return { ...p, navLabel: meta?.navLabel ?? p.name, order: meta?.order ?? 0 }
        }).sort((a, b) => a.order - b.order)
    )

    const movePageUp = useCallback((idx: number) => {
        if (idx === 0) return
        setPageOrder((prev) => {
            const next = [...prev]
            ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
            return next.map((p, i) => ({ ...p, order: i }))
        })
    }, [])

    const movePageDown = useCallback((idx: number) => {
        setPageOrder((prev) => {
            if (idx >= prev.length - 1) return prev
            const next = [...prev]
            ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
            return next.map((p, i) => ({ ...p, order: i }))
        })
    }, [])

    const updateNavLabel = useCallback((id: string, label: string) => {
        setPageOrder((prev) => prev.map((p) => (p.id === id ? { ...p, navLabel: label } : p)))
    }, [])

    // ── SEO ────────────────────────────────────────────────────────────────
    const [seoTitle, setSeoTitle] = useState(initialConfig.seo.title)
    const [seoDescription, setSeoDescription] = useState(initialConfig.seo.description)
    const [seoKeywords, setSeoKeywords] = useState(initialConfig.seo.keywords.join(', '))

    // ── Modules ─────────────────────────────────────────────────────────────
    const [modules, setModules] = useState({
        chatbot: initialConfig.modules.chatbot,
        analytics: initialConfig.modules.analytics,
        seo: initialConfig.modules.seo,
        integrations: initialConfig.modules.integrations,
    })

    const toggleModule = (key: keyof typeof modules) =>
        setModules((cur) => ({ ...cur, [key]: !cur[key] }))

    // ── Delete dialog ────────────────────────────────────────────────────────
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    // ── Actions ──────────────────────────────────────────────────────────────
    const [state, action] = useActionState(updateSite, { error: '', success: false })
    const [deleteState, deleteAction, isDeleting] = useActionState(deleteSite, { error: '', success: false })

    // Build merged configJson for hidden input
    const buildConfigJson = () => {
        const base = initialSite.configJson ?? {}
        return JSON.stringify({
            ...base,
            theme,
            primaryColor,
            logoUrl: logoUrl || null,
            designSystem: {
                ...(base.designSystem ?? {}),
                fontFamily,
                borderRadius,
            },
            nav: {
                style: navStyle,
                ctaText: navCtaText,
                ctaUrl: navCtaUrl,
                showCta,
            },
            footer: {
                ...(base.footer ?? {}),
                style: footerStyle,
            },
            seo: {
                title: seoTitle,
                description: seoDescription,
                keywords: seoKeywords.split(',').map((k) => k.trim()).filter(Boolean),
            },
            modules,
            pages: pageOrder.map((p) => ({ id: p.id, navLabel: p.navLabel, order: p.order })),
        })
    }

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                category="Sites"
                title={`Configurar ${initialSite.name}`}
                icon={Globe}
                actions={
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/s/${initialSite.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Ver site
                        </Link>
                        <Link href="/sites" className="text-sm font-bold text-primary hover:underline">
                            <ArrowLeft className="w-4 h-4 inline-block mr-1" />
                            Voltar
                        </Link>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-6">
                {/* ── Sidebar ── */}
                <aside className="space-y-3 rounded-(--radius) border border-border bg-card p-4 h-fit">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground font-bold">Configuração</p>
                    <div className="space-y-1">
                        {tabItems.map((item) => (
                            <button
                                type="button"
                                key={item.key}
                                onClick={() => setTab(item.key)}
                                className={cn(
                                    'flex w-full items-center gap-3 rounded-(--radius) px-3 py-2.5 text-left text-sm font-medium transition',
                                    tab === item.key
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-foreground hover:bg-muted/70',
                                )}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </aside>

                {/* ── Content ── */}
                <section className="space-y-6 min-w-0">

                    {/* Global save notice */}
                    {state.error && <InlineNotice variant="destructive" message={state.error} size="sm" />}
                    {state.success && <InlineNotice variant="success" message="Configurações salvas com sucesso." size="sm" />}

                    {/* ── DESIGN TAB ── */}
                    {tab === 'design' && (
                        <form action={action} className="space-y-6">
                            <input type="hidden" name="siteId" value={initialSite.id} />
                            <input type="hidden" name="name" value={siteName} />
                            <input type="hidden" name="configJson" value={buildConfigJson()} />
                            <input type="hidden" name="primaryColor" value={primaryColor} />
                            <input type="hidden" name="theme" value={theme} />
                            <input type="hidden" name="logoUrl" value={logoUrl} />

                            {/* Theme */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Monitor className="w-4 h-4" /> Tema</CardTitle>
                                    <CardDescription>Aparência base do site para os visitantes.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-3">
                                        <OptionCard
                                            selected={theme === 'light'}
                                            onClick={() => setTheme('light')}
                                            label="Light"
                                            description="Fundo claro, textos escuros"
                                            preview={
                                                <div className="h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                                                    <Sun className="w-5 h-5 text-amber-400" />
                                                </div>
                                            }
                                        />
                                        <OptionCard
                                            selected={theme === 'dark'}
                                            onClick={() => setTheme('dark')}
                                            label="Dark"
                                            description="Fundo escuro, textos claros"
                                            preview={
                                                <div className="h-12 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center">
                                                    <Moon className="w-5 h-5 text-indigo-400" />
                                                </div>
                                            }
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Colors */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Palette className="w-4 h-4" /> Cores</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cor Primária</Label>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <input
                                                type="color"
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="h-9 w-14 cursor-pointer rounded-(--radius) border border-border bg-transparent p-0.5"
                                            />
                                            <Input
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                placeholder="#6366f1"
                                                className="font-mono w-32"
                                            />
                                            <div
                                                className="h-9 w-9 rounded-(--radius) border border-border shadow-sm flex-shrink-0"
                                                style={{ backgroundColor: primaryColor }}
                                            />
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {['#6366f1', '#0f766e', '#ec4899', '#f59e0b', '#334155', '#1e40af', '#dc2626', '#16a34a'].map((c) => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => setPrimaryColor(c)}
                                                    className={cn(
                                                        'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110',
                                                        primaryColor === c ? 'border-foreground scale-110' : 'border-transparent',
                                                    )}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">URL do Logo</Label>
                                        <Input
                                            className="mt-1.5"
                                            placeholder="https://exemplo.com/logo.png"
                                            value={logoUrl}
                                            onChange={(e) => setLogoUrl(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Deixe em branco para usar o nome do site como logo.</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Nav style */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><LayoutTemplate className="w-4 h-4" /> Estilo do Header</CardTitle>
                                    <CardDescription>Como o menu de navegação aparece no topo do site.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-3">
                                        {([
                                            { value: 'transparent', label: 'Transparente', description: 'Flutua sobre o hero' },
                                            { value: 'frosted', label: 'Fosco', description: 'Efeito vidro com blur' },
                                            { value: 'solid', label: 'Sólido', description: 'Fundo opaco fixo' },
                                        ] as const).map((opt) => (
                                            <OptionCard
                                                key={opt.value}
                                                selected={navStyle === opt.value}
                                                onClick={() => setNavStyle(opt.value)}
                                                label={opt.label}
                                                description={opt.description}
                                                preview={<NavPreview style={opt.value} />}
                                            />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Footer style */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Footprints className="w-4 h-4" /> Estilo do Rodapé</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-3">
                                        {([
                                            { value: 'minimal', label: 'Minimal', description: 'Linha única compacta' },
                                            { value: 'columns', label: 'Colunas', description: 'Com grupos de links' },
                                            { value: 'centered', label: 'Centrado', description: 'Layout centralizado' },
                                        ] as const).map((opt) => (
                                            <OptionCard
                                                key={opt.value}
                                                selected={footerStyle === opt.value}
                                                onClick={() => setFooterStyle(opt.value)}
                                                label={opt.label}
                                                description={opt.description}
                                                preview={<FooterPreview style={opt.value} />}
                                            />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Typography & shape */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Type className="w-4 h-4" /> Tipografia e Forma</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Família de Fonte</Label>
                                        <select
                                            value={fontFamily}
                                            onChange={(e) => setFontFamily(e.target.value)}
                                            className="mt-1.5 w-full rounded-(--radius) border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="inter">Inter (padrão)</option>
                                            <option value="roboto">Roboto</option>
                                            <option value="montserrat">Montserrat</option>
                                            <option value="poppins">Poppins</option>
                                            <option value="playfair">Playfair Display</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cantos (Border Radius)</Label>
                                        <select
                                            value={borderRadius}
                                            onChange={(e) => setBorderRadius(e.target.value)}
                                            className="mt-1.5 w-full rounded-(--radius) border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="none">Nenhum (quadrado)</option>
                                            <option value="sm">Pequeno (4px)</option>
                                            <option value="md">Médio (8px)</option>
                                            <option value="lg">Grande (16px)</option>
                                            <option value="full">Completo (pill)</option>
                                        </select>
                                    </div>
                                </CardContent>
                            </Card>

                            <Button type="submit" className="h-9 px-5 text-xs font-bold uppercase tracking-wider">
                                Salvar Design
                            </Button>
                        </form>
                    )}

                    {/* ── NAVIGATION TAB ── */}
                    {tab === 'navigation' && (
                        <form action={action} className="space-y-6">
                            <input type="hidden" name="siteId" value={initialSite.id} />
                            <input type="hidden" name="name" value={siteName} />
                            <input type="hidden" name="configJson" value={buildConfigJson()} />
                            <input type="hidden" name="primaryColor" value={primaryColor} />
                            <input type="hidden" name="theme" value={theme} />

                            <Card>
                                <CardHeader>
                                    <CardTitle>Botão de Ação (CTA)</CardTitle>
                                    <CardDescription>Botão destacado no canto do menu principal.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowCta(!showCta)}
                                            className={cn(
                                                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none',
                                                showCta ? 'bg-primary' : 'bg-muted',
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform',
                                                    showCta ? 'translate-x-5' : 'translate-x-0',
                                                )}
                                            />
                                        </button>
                                        <Label className="cursor-pointer" onClick={() => setShowCta(!showCta)}>
                                            {showCta ? 'CTA visível no menu' : 'CTA oculto'}
                                        </Label>
                                    </div>

                                    {showCta && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Texto do Botão</Label>
                                                <Input
                                                    className="mt-1.5"
                                                    placeholder="Começar grátis"
                                                    value={navCtaText}
                                                    onChange={(e) => setNavCtaText(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">URL de destino</Label>
                                                <Input
                                                    className="mt-1.5"
                                                    placeholder="#contato"
                                                    value={navCtaUrl}
                                                    onChange={(e) => setNavCtaUrl(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Ordem e Labels das Páginas</CardTitle>
                                    <CardDescription>Defina a ordem e o nome de cada item no menu de navegação.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {pageOrder.map((page, idx) => (
                                            <div key={page.id} className="flex items-center gap-3 rounded-(--radius) border border-border bg-card p-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => movePageUp(idx)}
                                                        disabled={idx === 0}
                                                        className="p-0.5 rounded hover:bg-muted disabled:opacity-30 transition-opacity"
                                                    >
                                                        <ChevronUp className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => movePageDown(idx)}
                                                        disabled={idx === pageOrder.length - 1}
                                                        className="p-0.5 rounded hover:bg-muted disabled:opacity-30 transition-opacity"
                                                    >
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <span className="text-xs font-bold text-muted-foreground w-5 text-center">{idx + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <Input
                                                        value={page.navLabel}
                                                        onChange={(e) => updateNavLabel(page.id, e.target.value)}
                                                        className="h-8 text-sm"
                                                        placeholder={page.name}
                                                    />
                                                </div>
                                                <div className="text-xs text-muted-foreground shrink-0 max-w-[120px] truncate">
                                                    {page.isHomepage ? <span className="text-primary font-bold">Home</span> : `/${page.slug}`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {pageOrder.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-6">Nenhuma página publicada ainda.</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Button type="submit" className="h-9 px-5 text-xs font-bold uppercase tracking-wider">
                                Salvar Navegação
                            </Button>
                        </form>
                    )}

                    {/* ── GENERAL TAB ── */}
                    {tab === 'general' && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Configurações Gerais</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {state.error && <InlineNotice variant="destructive" message={state.error} size="sm" className="mb-4" />}
                                    {state.success && <InlineNotice variant="success" message="Configurações salvas." size="sm" className="mb-4" />}

                                    <form action={action} className="space-y-4">
                                        <input type="hidden" name="siteId" value={initialSite.id} />
                                        <input type="hidden" name="configJson" value={buildConfigJson()} />
                                        <input type="hidden" name="primaryColor" value={primaryColor} />
                                        <input type="hidden" name="theme" value={theme} />

                                        <div>
                                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome do Site</Label>
                                            <Input
                                                name="name"
                                                value={siteName}
                                                onChange={(e) => setSiteName(e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descrição</Label>
                                            <textarea
                                                name="description"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                rows={3}
                                                className="mt-1.5 w-full rounded-(--radius) border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                                                placeholder="Breve descrição do site para referência interna..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                            <div>
                                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">ID do Site</Label>
                                                <div className="mt-1 rounded-(--radius) border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground font-mono break-all">
                                                    {initialSite.id}
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
                                                <div className="mt-1 rounded-(--radius) border border-border bg-muted/40 px-3 py-2 text-sm">
                                                    {initialSite.status === 'published'
                                                        ? <span className="text-green-600 font-medium">● Publicado</span>
                                                        : <span className="text-amber-600 font-medium">● Rascunho</span>
                                                    }
                                                </div>
                                            </div>
                                        </div>

                                        <Button type="submit" className="h-9 px-5 text-xs font-bold uppercase tracking-wider">
                                            Salvar
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Danger zone */}
                            <Card className="border-destructive/20">
                                <CardHeader>
                                    <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                                    <CardDescription>Ações irreversíveis para este site.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {deleteState.error && <InlineNotice variant="destructive" message={deleteState.error} size="sm" className="mb-4" />}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border p-4">
                                        <div>
                                            <p className="font-semibold text-sm">Excluir Site</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Remove permanentemente o site, páginas e base de conhecimento associada.
                                            </p>
                                        </div>
                                        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="destructive" size="sm">Excluir Site</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader className="mb-4">
                                                    <DialogTitle className="hidden">Excluir Site</DialogTitle>
                                                    <DangerConfirmationHeader
                                                        title="Excluir Site Definitivamente?"
                                                        subtitle="Esta ação não pode ser desfeita."
                                                    />
                                                </DialogHeader>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    O site <strong>{initialSite.name}</strong> será removido do banco de dados, incluindo páginas, configurações e base RAG.
                                                </p>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button variant="outline" disabled={isDeleting}>Cancelar</Button>
                                                    </DialogClose>
                                                    <form action={deleteAction} onSubmit={() => setIsDeleteDialogOpen(false)}>
                                                        <input type="hidden" name="siteId" value={initialSite.id} />
                                                        <Button type="submit" variant="destructive" disabled={isDeleting}>
                                                            {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
                                                        </Button>
                                                    </form>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* ── PAGES TAB ── */}
                    {tab === 'pages' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Páginas do Site</CardTitle>
                                <CardDescription>Gerencie as páginas que compõem este site multi-página.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {initialPages.map((page) => (
                                        <div key={page.id} className="flex items-center justify-between rounded-(--radius) border border-border p-4 bg-card">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold">{page.name}</p>
                                                    {page.isHomepage && (
                                                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">
                                                            Home
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">/{page.slug}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    'text-[10px] px-2 py-0.5 rounded font-bold uppercase',
                                                    page.status === 'published'
                                                        ? 'bg-green-500/10 text-green-600'
                                                        : 'bg-amber-500/10 text-amber-600',
                                                )}>
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

                                <div className="mt-6 rounded-(--radius) border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                                    <p className="font-medium flex items-center gap-2">
                                        <Sparkles className="size-4 text-primary" />
                                        Multi-página ativo
                                    </p>
                                    <p className="mt-1.5 text-xs">
                                        Cada página é um editor de landing page completo. Configure seções, chatbot e SEO individualmente por página.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── SEO TAB ── */}
                    {tab === 'seo' && (
                        <form action={action} className="space-y-6">
                            <input type="hidden" name="siteId" value={initialSite.id} />
                            <input type="hidden" name="name" value={siteName} />
                            <input type="hidden" name="configJson" value={buildConfigJson()} />
                            <input type="hidden" name="primaryColor" value={primaryColor} />
                            <input type="hidden" name="theme" value={theme} />

                            <Card>
                                <CardHeader>
                                    <CardTitle>SEO do Site</CardTitle>
                                    <CardDescription>Metadados padrão para mecanismos de busca. Cada página pode sobrescrever estes valores.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Título (title tag)</Label>
                                        <Input
                                            className="mt-1.5"
                                            placeholder="Meu Site Incrível"
                                            value={seoTitle}
                                            onChange={(e) => setSeoTitle(e.target.value)}
                                            maxLength={70}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">{seoTitle.length}/70 caracteres</p>
                                    </div>

                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descrição (meta description)</Label>
                                        <textarea
                                            className="mt-1.5 w-full rounded-(--radius) border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                                            rows={3}
                                            placeholder="Descrição concisa que aparece nos resultados de busca..."
                                            value={seoDescription}
                                            onChange={(e) => setSeoDescription(e.target.value)}
                                            maxLength={160}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">{seoDescription.length}/160 caracteres</p>
                                    </div>

                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Palavras-chave</Label>
                                        <Input
                                            className="mt-1.5"
                                            placeholder="marketing digital, landing page, conversão"
                                            value={seoKeywords}
                                            onChange={(e) => setSeoKeywords(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Separe por vírgula. Máximo 10 palavras-chave.</p>
                                    </div>

                                    {/* Preview */}
                                    <div className="mt-2 rounded-(--radius) border border-border bg-muted/30 p-4">
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">Preview no Google</p>
                                        <p className="text-[#1a0dab] text-base font-medium truncate">{seoTitle || siteName}</p>
                                        <p className="text-[#006621] text-xs mt-0.5">{`https://convertai.com.br/s/...`}</p>
                                        <p className="text-[#545454] text-sm mt-1 line-clamp-2">
                                            {seoDescription || 'Sem descrição configurada.'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Button type="submit" className="h-9 px-5 text-xs font-bold uppercase tracking-wider">
                                Salvar SEO
                            </Button>
                        </form>
                    )}

                    {/* ── MODULES TAB ── */}
                    {tab === 'modules' && (
                        <form action={action} className="space-y-6">
                            <input type="hidden" name="siteId" value={initialSite.id} />
                            <input type="hidden" name="name" value={siteName} />
                            <input type="hidden" name="configJson" value={buildConfigJson()} />
                            <input type="hidden" name="primaryColor" value={primaryColor} />
                            <input type="hidden" name="theme" value={theme} />

                            <Card>
                                <CardHeader>
                                    <CardTitle>Módulos do Site</CardTitle>
                                    <CardDescription>Ative ou desative recursos disponíveis para este site.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-3">
                                        {([
                                            { key: 'chatbot' as const, label: 'Chatbot IA', description: 'Assistente conversacional para visitantes do site.' },
                                            { key: 'analytics' as const, label: 'Analytics', description: 'Coleta eventos de visita, cliques e desempenho por página.' },
                                            { key: 'seo' as const, label: 'SEO Avançado', description: 'Schema.org, sitemap automático e meta tags otimizadas.' },
                                            { key: 'integrations' as const, label: 'Integrações', description: 'Conecte WhatsApp, e-mail ou sistemas externos.' },
                                        ]).map((mod) => (
                                            <div key={mod.key} className="flex items-center justify-between rounded-(--radius) border border-border p-4">
                                                <div>
                                                    <p className="font-medium text-sm">{mod.label}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleModule(mod.key)}
                                                    className={cn(
                                                        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                                                        modules[mod.key] ? 'bg-primary' : 'bg-muted',
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                                                            modules[mod.key] ? 'translate-x-5' : 'translate-x-0',
                                                        )}
                                                    />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Button type="submit" className="h-9 px-5 text-xs font-bold uppercase tracking-wider">
                                Salvar Módulos
                            </Button>
                        </form>
                    )}

                    {/* ── DOMAINS TAB ── */}
                    {tab === 'custom-domains' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Domínios Personalizados</CardTitle>
                                <CardDescription>Associe um domínio próprio a este site.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-(--radius) border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                                    O gerenciamento de domínios personalizados é feito nas configurações globais do painel, onde você pode adicionar, verificar e ativar domínios para sua organização.
                                </div>
                                <Link
                                    href="/settings?tab=domains"
                                    className="inline-flex items-center gap-2 rounded-(--radius) border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
                                >
                                    <Globe className="w-4 h-4" />
                                    Gerenciar Domínios
                                </Link>
                            </CardContent>
                        </Card>
                    )}

                </section>
            </div>
        </div>
    )
}

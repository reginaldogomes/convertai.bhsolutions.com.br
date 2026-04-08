import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import type { DashboardStats } from '@/application/use-cases/dashboard'
import Link from 'next/link'
import {
    Users, MessageSquare, Mail, TrendingUp, Globe, Zap, Instagram, Bot,
    Eye, MousePointer, ArrowUpRight, CheckCircle2,
    FileText,
    BarChart3,
    type LucideIcon,
} from 'lucide-react'

const emptyStats: DashboardStats = {
    newLeads: 0, openConversations: 0, campaignsSent: 0, conversionRate: 0,
    totalContacts: 0, totalDeals: 0, dealsWon: 0,
    landingPages: 0, landingPagesPublished: 0, landingPageViews: 0, landingPageLeads: 0,
    automationsTotal: 0, automationsActive: 0, instagramContents: 0,
}

type StatsKey = keyof DashboardStats

interface KpiCard {
    key: StatsKey
    label: string
    icon: LucideIcon
    color: string
    suffix?: string
}

const kpiCards: KpiCard[] = [
    { key: 'newLeads', label: 'Novos Leads (7d)', icon: Users, color: 'text-primary' },
    { key: 'openConversations', label: 'Conversas Abertas', icon: MessageSquare, color: 'text-blue-400' },
    { key: 'campaignsSent', label: 'Campanhas Enviadas', icon: Mail, color: 'text-green-400' },
    { key: 'conversionRate', label: 'Taxa de Conversão', icon: TrendingUp, color: 'text-yellow-400', suffix: '%' },
]

interface ModuleCard {
    href: string
    label: string
    icon: LucideIcon
    color: string
    bgColor: string
    metrics: { key: StatsKey; label: string; suffix?: string }[]
}

const moduleCards: ModuleCard[] = [
    {
        href: '/contacts',
        label: 'Contatos',
        icon: Users,
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        metrics: [
            { key: 'totalContacts', label: 'Total' },
            { key: 'newLeads', label: 'Novos (7d)' },
        ],
    },
    {
        href: '/deals',
        label: 'Pipeline (Deals)',
        icon: TrendingUp,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-400/10',
        metrics: [
            { key: 'totalDeals', label: 'Total' },
            { key: 'dealsWon', label: 'Ganhos' },
            { key: 'conversionRate', label: 'Conversão', suffix: '%' },
        ],
    },
    {
        href: '/inbox',
        label: 'WhatsApp / Inbox',
        icon: MessageSquare,
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/10',
        metrics: [
            { key: 'openConversations', label: 'Conversas abertas' },
        ],
    },
    {
        href: '/campaigns',
        label: 'Campanhas',
        icon: Mail,
        color: 'text-green-400',
        bgColor: 'bg-green-400/10',
        metrics: [
            { key: 'campaignsSent', label: 'Enviadas' },
        ],
    },
    {
        href: '/landing-pages',
        label: 'Landing Pages',
        icon: Globe,
        color: 'text-violet-400',
        bgColor: 'bg-violet-400/10',
        metrics: [
            { key: 'landingPages', label: 'Criadas' },
            { key: 'landingPagesPublished', label: 'Publicadas' },
            { key: 'landingPageViews', label: 'Visualizações' },
            { key: 'landingPageLeads', label: 'Leads capturados' },
        ],
    },
    {
        href: '/automations',
        label: 'Automações',
        icon: Zap,
        color: 'text-orange-400',
        bgColor: 'bg-orange-400/10',
        metrics: [
            { key: 'automationsTotal', label: 'Total' },
            { key: 'automationsActive', label: 'Ativas' },
        ],
    },
    {
        href: '/instagram',
        label: 'Instagram',
        icon: Instagram,
        color: 'text-pink-400',
        bgColor: 'bg-pink-400/10',
        metrics: [
            { key: 'instagramContents', label: 'Conteúdos criados' },
        ],
    },
    {
        href: '/agents',
        label: 'Agentes IA',
        icon: Bot,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-400/10',
        metrics: [],
    },
    {
        href: '/analytics',
        label: 'Analytics',
        icon: BarChart3,
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-400/10',
        metrics: [
            { key: 'landingPageViews', label: 'Impressões' },
            { key: 'landingPageLeads', label: 'Leads' },
            { key: 'conversionRate', label: 'Conversão', suffix: '%' },
        ],
    },
    {
        href: '/release-notes',
        label: 'Release Notes',
        icon: FileText,
        color: 'text-slate-300',
        bgColor: 'bg-slate-300/10',
        metrics: [],
    },
]

export default async function DashboardPage() {
    const auth = await tryGetAuthContext()
    const stats: DashboardStats = auth
        ? await useCases.getDashboardStats().execute(auth.orgId)
        : emptyStats

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-6">
                <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] font-medium mb-1">Visão Geral</p>
                    <h1 className="text-foreground text-2xl font-black tracking-tight">Dashboard</h1>
                </div>
                <div className="text-muted-foreground/60 text-xs font-mono-data">
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {kpiCards.map(({ key, label, icon: Icon, color, suffix }) => (
                    <div key={key} className="bg-card border border-border p-5 space-y-3 hover:border-primary transition-colors rounded-(--radius)">
                        <div className="flex items-center justify-between">
                            <p className="text-muted-foreground text-xs uppercase tracking-wider">{label}</p>
                            <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                        <p className={`text-3xl font-black font-mono-data tracking-tight ${color}`}>
                            {stats[key]}{suffix}
                        </p>
                    </div>
                ))}
            </div>

            {/* Module Cards */}
            <div>
                <h2 className="text-foreground font-bold text-sm mb-4 uppercase tracking-wider">Módulos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {moduleCards.map(({ href, label, icon: Icon, color, bgColor, metrics }) => (
                        <Link
                            key={href}
                            href={href}
                            className="group bg-card border border-border p-5 hover:border-primary transition-all rounded-(--radius) flex flex-col justify-between gap-4"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-(--radius) ${bgColor} flex items-center justify-center`}>
                                        <Icon className={`w-4.5 h-4.5 ${color}`} />
                                    </div>
                                    <span className="text-foreground font-bold text-sm">{label}</span>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            {metrics.length > 0 ? (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    {metrics.map(({ key, label: metricLabel, suffix: metricSuffix }) => (
                                        <div key={key}>
                                            <p className="text-lg font-black font-mono-data tracking-tight text-foreground">
                                                {stats[key]}{metricSuffix}
                                            </p>
                                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">{metricLabel}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-xs">Acessar módulo →</p>
                            )}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Pipeline by Stage */}
                <div className="bg-card border border-border p-6 rounded-(--radius)">
                    <h2 className="text-foreground font-bold text-sm mb-4 uppercase tracking-wider">Pipeline por Estágio</h2>
                    <div className="space-y-2">
                        {['Novo Lead', 'Contato', 'Proposta', 'Negociação', 'Fechado'].map((stage, i) => (
                            <div key={stage} className="flex items-center gap-3">
                                <p className="text-muted-foreground text-xs w-24 shrink-0">{stage}</p>
                                <div className="flex-1 h-1.5 bg-muted rounded-full">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(5, 80 - i * 15)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Landing Pages Performance */}
                <div className="bg-card border border-border p-6 rounded-(--radius)">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-foreground font-bold text-sm uppercase tracking-wider">Landing Pages</h2>
                        <Link href="/landing-pages" className="text-primary text-xs hover:underline">Ver todas</Link>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Visualizações', value: stats.landingPageViews, icon: Eye, color: 'text-violet-400' },
                            { label: 'Leads Capturados', value: stats.landingPageLeads, icon: Users, color: 'text-green-400' },
                            { label: 'Cliques no CTA', value: 0, icon: MousePointer, color: 'text-blue-400' },
                            { label: 'Publicadas', value: stats.landingPagesPublished, icon: CheckCircle2, color: 'text-emerald-400' },
                        ].map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</p>
                                </div>
                                <p className="text-foreground text-xl font-black font-mono-data">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

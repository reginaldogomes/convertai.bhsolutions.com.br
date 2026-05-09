import {
    Instagram, Eye, Clock, TrendingUp, Settings2, Send,
    Heart, Bookmark, Users, BarChart3, Zap, CalendarDays,
    FileText, CheckCircle2,
} from 'lucide-react'
import { tryGetAuthContext } from '@/infrastructure/auth'
import { redirect } from 'next/navigation'
import { useCases, instagramAccountRepo, instagramAutoConfigRepo } from '@/application/services/container'
import { InstagramContent } from '@/domain/entities/instagram-content'
import { CreateContentButton } from '@/components/instagram/CreateContentButton'
import { ContentCard } from '@/components/instagram/ContentCard'
import { ConnectInstagramModal } from '@/components/instagram/ConnectInstagramModal'
import { GenerateContentButton } from '@/components/instagram/GenerateContentButton'
import { CalendarButton } from '@/components/instagram/CalendarButton'
import { TokenStatusBanner, TokenOkBadge } from '@/components/instagram/TokenStatusBanner'
import { PageHeader } from '@/components/layout/PageHeader'
import dynamic from 'next/dynamic'
import type { LucideIcon } from 'lucide-react'

const AutoContentConfig = dynamic(
    () => import('@/components/instagram/AutoContentConfig').then(m => m.AutoContentConfig),
    { loading: () => <div className="h-48 animate-pulse bg-secondary rounded-(--radius)" /> }
)
const CreativeGenerator = dynamic(() => import('@/components/instagram/CreativeGenerator').then(m => m.CreativeGenerator))
const ViralContentStudio = dynamic(() => import('@/components/instagram/ViralContentStudio').then(m => m.ViralContentStudio))

// ─── Labels / Colors ──────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
    post: 'Post', story: 'Story', reel: 'Reel', carousel: 'Carrossel',
}

const STATUS_LABELS: Record<string, string> = {
    draft: 'Rascunho', scheduled: 'Agendado', publishing: 'Publicando...',
    published: 'Publicado', failed: 'Falhou',
}

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-secondary text-foreground-secondary border-border',
    scheduled: 'bg-[hsl(var(--info)/0.1)] text-[hsl(var(--info))] border-[hsl(var(--info)/0.3)]',
    publishing: 'bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.3)]',
    published: 'bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))] border-[hsl(var(--success))]',
    failed: 'bg-[hsl(var(--destructive-subtle))] text-[hsl(var(--destructive))] border-[hsl(var(--destructive))]',
}

// ─── KPI config ───────────────────────────────────────────────────────────────

interface KpiDef { key: string; label: string; icon: LucideIcon; color: string; suffix?: string }

const KPI_DEFS: KpiDef[] = [
    { key: 'published', label: 'Publicados', icon: CheckCircle2, color: 'text-[hsl(var(--success))]' },
    { key: 'drafts', label: 'Rascunhos', icon: FileText, color: 'text-muted-foreground' },
    { key: 'scheduled', label: 'Agendados', icon: Clock, color: 'text-[hsl(var(--info))]' },
    { key: 'totalReach', label: 'Alcance Total', icon: Eye, color: 'text-primary' },
    { key: 'totalLikes', label: 'Curtidas', icon: Heart, color: 'text-rose-500' },
    { key: 'totalSaves', label: 'Salvamentos', icon: Bookmark, color: 'text-amber-500' },
    { key: 'engagement', label: 'Engajamento Médio', icon: TrendingUp, color: 'text-[hsl(var(--success))]', suffix: '%' },
    { key: 'followers', label: 'Seguidores', icon: Users, color: 'text-primary' },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function InstagramPage() {
    const auth = await tryGetAuthContext()
    if (!auth) redirect('/login')

    const [contents, account, autoConfig] = await Promise.all([
        useCases.listInstagramContents().execute(auth.orgId),
        instagramAccountRepo.findByOrgId(auth.orgId),
        instagramAutoConfigRepo.findByOrgId(auth.orgId),
    ])

    const items = contents.map(c => InstagramContent.fromRow(c))

    const published = items.filter(i => i.isPublished())
    const drafts = items.filter(i => i.isDraft())
    const scheduled = items.filter(i => i.isScheduled())
    const failed = items.filter(i => i.status === 'failed')

    const totalReach = published.reduce((sum, i) => sum + (i.metrics.reach ?? 0), 0)
    const totalLikes = published.reduce((sum, i) => sum + (i.metrics.likes ?? 0), 0)
    const totalSaves = published.reduce((sum, i) => sum + (i.metrics.saves ?? 0), 0)
    const engPublished = published.filter(i => i.metrics.engagement_rate > 0)
    const avgEngagement = engPublished.length > 0
        ? engPublished.reduce((sum, i) => sum + i.metrics.engagement_rate, 0) / engPublished.length
        : 0

    const stats: Record<string, number> = {
        published: published.length,
        drafts: drafts.length,
        scheduled: scheduled.length,
        totalReach,
        totalLikes,
        totalSaves,
        engagement: avgEngagement,
        followers: account?.followers_count ?? 0,
    }

    return (
        <div className="p-8 space-y-6 max-w-7xl">
            <PageHeader
                category="Social Media"
                title="Instagram"
                icon={Instagram}
                actions={
                    <div className="flex items-center gap-2">
                        <ViralContentStudio />
                        <GenerateContentButton />
                        <CreativeGenerator />
                        <CalendarButton />
                        <CreateContentButton />
                    </div>
                }
            />

            {/* Token status */}
            {account && <TokenStatusBanner tokenExpiresAt={account.token_expires_at} />}

            {/* Connect prompt */}
            {!account && <ConnectInstagramModal />}

            {/* KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
                {KPI_DEFS.map(({ key, label, icon: Icon, color, suffix }) => (
                    <div
                        key={key}
                        className="bg-card border border-border rounded-(--radius) p-4 space-y-2 hover:border-primary/40 transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-tight">{label}</p>
                            <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
                        </div>
                        <p className={`text-2xl font-black font-mono-data tracking-tight ${color}`}>
                            {key === 'engagement'
                                ? stats[key].toFixed(1)
                                : stats[key] >= 1000
                                ? (stats[key] / 1000).toFixed(1) + 'K'
                                : stats[key]}
                            {suffix}
                        </p>
                    </div>
                ))}
            </div>

            {/* Account Info */}
            {account && (
                <div className="bg-card border border-border rounded-(--radius) p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Instagram className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-sm">@{account.ig_username}</p>
                            <TokenOkBadge tokenExpiresAt={account.token_expires_at} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            <span className="font-mono-data">{account.followers_count.toLocaleString('pt-BR')}</span> seguidores ·{' '}
                            <span className="font-mono-data">{account.media_count}</span> publicações
                        </p>
                    </div>
                    <ConnectInstagramModal isConnected username={account.ig_username} />
                </div>
            )}

            {/* Main content area — split into columns on large screens */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
                {/* Left: Content Grid */}
                <div className="space-y-5">
                    {/* Sections by status */}
                    {scheduled.length > 0 && (
                        <ContentSection
                            title="Agendados"
                            icon={<CalendarDays className="w-4 h-4 text-[hsl(var(--info))]" />}
                            count={scheduled.length}
                            items={scheduled}
                        />
                    )}
                    {failed.length > 0 && (
                        <ContentSection
                            title="Falharam"
                            icon={<Send className="w-4 h-4 text-destructive" />}
                            count={failed.length}
                            items={failed}
                        />
                    )}
                    {drafts.length > 0 && (
                        <ContentSection
                            title="Rascunhos"
                            icon={<FileText className="w-4 h-4 text-muted-foreground" />}
                            count={drafts.length}
                            items={drafts}
                        />
                    )}
                    {published.length > 0 && (
                        <ContentSection
                            title="Publicados"
                            icon={<CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" />}
                            count={published.length}
                            items={published}
                        />
                    )}
                    {items.length === 0 && (
                        <div className="border border-dashed border-border rounded-(--radius) p-16 flex flex-col items-center justify-center text-center bg-secondary/30">
                            <Instagram className="w-10 h-10 text-muted-foreground/20 mb-4" />
                            <p className="text-muted-foreground text-sm font-medium">Nenhum conteúdo ainda</p>
                            <p className="text-muted-foreground/60 text-xs mt-2 max-w-xs">
                                Use o Studio Viral para gerar conteúdo de alta performance com IA e base de conhecimento da sua marca.
                            </p>
                        </div>
                    )}
                </div>

                {/* Right: Config + Analytics sidebar */}
                <div className="space-y-4">
                    {/* Auto-config */}
                    <div className="bg-card border border-border rounded-(--radius)">
                        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Settings2 className="w-3.5 h-3.5 text-primary" />
                                <span className="text-xs font-bold uppercase tracking-wider">Configuração IA</span>
                            </div>
                            {autoConfig?.active && (
                                <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] shadow-[0_0_6px_hsl(var(--success)/0.6)]" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-[hsl(var(--success))]">Ativo</span>
                                </span>
                            )}
                        </div>
                        <div className="p-4">
                            <AutoContentConfig config={autoConfig} />
                        </div>
                    </div>

                    {/* Performance Summary */}
                    {published.length > 0 && (
                        <div className="bg-card border border-border rounded-(--radius)">
                            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                                <BarChart3 className="w-3.5 h-3.5 text-primary" />
                                <span className="text-xs font-bold uppercase tracking-wider">Performance</span>
                            </div>
                            <div className="p-4 space-y-3">
                                <PerformanceRow label="Alcance total" value={totalReach.toLocaleString('pt-BR')} />
                                <PerformanceRow label="Curtidas totais" value={totalLikes.toLocaleString('pt-BR')} />
                                <PerformanceRow label="Salvamentos" value={totalSaves.toLocaleString('pt-BR')} />
                                <PerformanceRow
                                    label="Engajamento médio"
                                    value={`${avgEngagement.toFixed(2)}%`}
                                    highlight={avgEngagement >= 3}
                                />
                                <PerformanceRow
                                    label="Melhor formato"
                                    value={getBestFormat(published)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Viral Studio promo card */}
                    {!autoConfig?.niche && (
                        <div className="bg-primary/5 border border-primary/20 rounded-(--radius) p-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-primary" />
                                <span className="text-xs font-bold text-foreground">Studio Viral com IA</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Gere legendas virais, hooks, hashtags e horários ideais usando IA + sua base de conhecimento.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ContentSection({
    title, icon, count, items,
}: {
    title: string
    icon: React.ReactNode
    count: number
    items: InstagramContent[]
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                {icon}
                <h2 className="text-sm font-bold text-foreground">{title}</h2>
                <span className="text-xs text-muted-foreground font-mono-data">({count})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(item => (
                    <ContentCard
                        key={item.id}
                        content={{
                            id: item.id,
                            type: item.type,
                            typeLabel: TYPE_LABELS[item.type] || item.type,
                            caption: item.caption,
                            mediaUrls: item.mediaUrls,
                            hashtags: item.hashtags,
                            status: item.status,
                            statusLabel: STATUS_LABELS[item.status] || item.status,
                            statusColor: STATUS_COLORS[item.status] || 'bg-secondary text-foreground-secondary border-border',
                            metrics: item.metrics,
                            publishedAt: item.publishedAt,
                            scheduledAt: item.scheduledAt,
                            createdAt: item.createdAt,
                        }}
                    />
                ))}
            </div>
        </div>
    )
}

function PerformanceRow({
    label, value, highlight = false,
}: {
    label: string; value: string; highlight?: boolean
}) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span className={`font-bold font-mono-data ${highlight ? 'text-[hsl(var(--success))]' : 'text-foreground'}`}>{value}</span>
        </div>
    )
}

function getBestFormat(published: InstagramContent[]): string {
    if (published.length === 0) return '—'
    const byType: Record<string, { count: number; totalEng: number }> = {}
    for (const item of published) {
        if (!byType[item.type]) byType[item.type] = { count: 0, totalEng: 0 }
        byType[item.type].count++
        byType[item.type].totalEng += item.metrics.engagement_rate
    }
    const best = Object.entries(byType).sort((a, b) => {
        const avgA = a[1].totalEng / a[1].count
        const avgB = b[1].totalEng / b[1].count
        return avgB - avgA
    })[0]
    const labels: Record<string, string> = { post: 'Post', story: 'Story', reel: 'Reel', carousel: 'Carrossel' }
    return labels[best?.[0] ?? ''] ?? '—'
}

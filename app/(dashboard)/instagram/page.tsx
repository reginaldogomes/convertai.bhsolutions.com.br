import { Instagram, Eye, Clock, TrendingUp, Settings2 } from 'lucide-react'
import { tryGetAuthContext } from '@/infrastructure/auth'
import { redirect } from 'next/navigation'
import { useCases, instagramAccountRepo, instagramAutoConfigRepo } from '@/application/services/container'
import { InstagramContent } from '@/domain/entities/instagram-content'
import { CreateContentButton } from '@/components/instagram/CreateContentButton'
import { ContentCard } from '@/components/instagram/ContentCard'
import { ConnectInstagramModal } from '@/components/instagram/ConnectInstagramModal'
import { GenerateContentButton } from '@/components/instagram/GenerateContentButton'
import { GenerateImagePromptButton } from '@/components/instagram/GenerateImagePromptButton'
import { CalendarButton } from '@/components/instagram/CalendarButton'
import { PageHeader } from '@/components/layout/PageHeader'
import dynamic from 'next/dynamic'
import type { LucideIcon } from 'lucide-react'

const AutoContentConfig = dynamic(() => import('@/components/instagram/AutoContentConfig').then(m => m.AutoContentConfig), {
    loading: () => <div className="h-48 animate-pulse bg-secondary rounded-(--radius)" />,
})

const CreativeGenerator = dynamic(() => import('@/components/instagram/CreativeGenerator').then(m => m.CreativeGenerator))

const TYPE_LABELS: Record<string, string> = {
    post: 'Post',
    story: 'Story',
    reel: 'Reel',
    carousel: 'Carrossel',
}

const STATUS_LABELS: Record<string, string> = {
    draft: 'Rascunho',
    scheduled: 'Agendado',
    publishing: 'Publicando...',
    published: 'Publicado',
    failed: 'Falhou',
}

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-secondary text-foreground-secondary border-border',
    scheduled: 'bg-[hsl(var(--info)/0.1)] text-[hsl(var(--info))] border-[hsl(var(--info)/0.3)]',
    publishing: 'bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.3)]',
    published: 'bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))] border-[hsl(var(--success))]',
    failed: 'bg-[hsl(var(--destructive-subtle))] text-[hsl(var(--destructive))] border-[hsl(var(--destructive))]',
}

interface KpiCard {
    key: string
    label: string
    icon: LucideIcon
    color: string
    suffix?: string
}

const kpiCards: KpiCard[] = [
    { key: 'published', label: 'Publicados', icon: Eye, color: 'text-[hsl(var(--success))]' },
    { key: 'drafts', label: 'Rascunhos', icon: Clock, color: 'text-muted-foreground' },
    { key: 'scheduled', label: 'Agendados', icon: Clock, color: 'text-[hsl(var(--info))]' },
    { key: 'engagement', label: 'Engajamento', icon: TrendingUp, color: 'text-primary', suffix: '%' },
]

export default async function InstagramPage() {
    const auth = await tryGetAuthContext()
    if (!auth) redirect('/login')

    const [contents, account, autoConfig] = await Promise.all([
        useCases.listInstagramContents().execute(auth.orgId),
        instagramAccountRepo.findByOrgId(auth.orgId),
        instagramAutoConfigRepo.findByOrgId(auth.orgId),
    ])

    const items = contents.map(c => InstagramContent.fromRow(c))

    const stats: Record<string, number> = {
        published: items.filter(i => i.isPublished()).length,
        drafts: items.filter(i => i.isDraft()).length,
        scheduled: items.filter(i => i.isScheduled()).length,
        engagement: items
            .filter(i => i.isPublished() && i.metrics.engagement_rate > 0)
            .reduce((acc, i, _, arr) => acc + i.metrics.engagement_rate / arr.length, 0),
    }

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                category="Social Media"
                title="Instagram"
                icon={Instagram}
                actions={
                    <div className="flex items-center gap-2.5">
                        <CreateContentButton />
                        <GenerateContentButton />
                        <GenerateImagePromptButton />
                        <CreativeGenerator />
                        <CalendarButton />
                    </div>
                }
            />

            {/* Connect Account */}
            {!account && <ConnectInstagramModal />}

            {/* KPI Grid */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {kpiCards.map(({ key, label, icon: Icon, color, suffix }) => (
                    <div key={key} className="bg-card border border-border p-5 space-y-3 hover:border-primary transition-colors rounded-(--radius)">
                        <div className="flex items-center justify-between">
                            <p className="text-muted-foreground text-xs uppercase tracking-wider">{label}</p>
                            <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                        <p className={`text-3xl font-black font-mono-data tracking-tight ${color}`}>
                            {key === 'engagement' ? stats[key].toFixed(1) : stats[key]}{suffix}
                        </p>
                    </div>
                ))}
            </div>

            {/* Account Info */}
            {account && (
                <div className="bg-card border border-border p-5 flex items-center gap-4 rounded-(--radius)">
                    <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary-subtle))] flex items-center justify-center shrink-0">
                        <Instagram className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-sm text-foreground">@{account.ig_username}</p>
                        <p className="text-xs text-muted-foreground">
                            <span className="font-mono-data">{account.followers_count.toLocaleString('pt-BR')}</span> seguidores · <span className="font-mono-data">{account.media_count}</span> publicações
                        </p>
                    </div>
                    <ConnectInstagramModal isConnected username={account.ig_username} />
                </div>
            )}

            {/* Auto Content Configuration */}
            <div className="bg-card border border-border rounded-(--radius)">
                <div className="p-5 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Settings2 className="w-4 h-4 text-primary" />
                        <h2 className="text-foreground font-bold text-sm uppercase tracking-wider">Configuração Automática</h2>
                    </div>
                    {autoConfig?.active && (
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[hsl(var(--success))] shadow-[0_0_8px_hsl(var(--success)/0.5)]" />
                            <span className="text-[10px] uppercase font-bold tracking-widest text-[hsl(var(--success))]">Ativo</span>
                        </span>
                    )}
                </div>
                <div className="p-5">
                    <AutoContentConfig config={autoConfig} />
                </div>
            </div>

            {/* Content Grid */}
            {items.length === 0 ? (
                <div className="col-span-full border border-dashed border-border p-12 text-center flex flex-col items-center justify-center bg-secondary/50 rounded-(--radius)">
                    <Instagram className="w-8 h-8 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">Nenhum conteúdo criado.</p>
                    <p className="text-muted-foreground/60 text-xs mt-2 max-w-sm">
                        Comece criando posts, stories, reels e carrosséis para o Instagram. Use IA para gerar legendas e ideias de conteúdo.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
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
                                createdAt: item.createdAt,
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

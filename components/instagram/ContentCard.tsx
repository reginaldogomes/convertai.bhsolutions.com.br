'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { publishInstagramContent, deleteInstagramContent, syncInstagramMetrics } from '@/actions/instagram'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import {
    Image as ImageIcon, Film, Clock, SquareStack, Send, Trash2,
    Heart, MessageCircle, Share2, Bookmark, Eye, RefreshCw, TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { ScheduleButton } from './ScheduleButton'
import type { InstagramMetrics } from '@/domain/entities/instagram-content'

const TYPE_ICONS: Record<string, typeof ImageIcon> = {
    post: ImageIcon,
    story: Clock,
    reel: Film,
    carousel: SquareStack,
}

interface ContentCardProps {
    content: {
        id: string
        type: string
        typeLabel: string
        caption: string
        mediaUrls: string[]
        hashtags: string[]
        status: string
        statusLabel: string
        statusColor: string
        metrics: InstagramMetrics
        publishedAt: string | null
        scheduledAt: string | null
        createdAt: string
    }
}

export function ContentCard({ content }: ContentCardProps) {
    const [isPendingPublish, startPublish] = useTransition()
    const [isPendingDelete, startDelete] = useTransition()
    const [isPendingSync, startSync] = useTransition()
    const router = useRouter()
    const TypeIcon = TYPE_ICONS[content.type] || ImageIcon

    function handlePublish() {
        startPublish(async () => {
            const result = await publishInstagramContent(content.id)
            if (result.error) toast.error(result.error)
            else { toast.success('Publicado no Instagram!'); router.refresh() }
        })
    }

    function handleDelete() {
        if (!confirm('Excluir este conteúdo? Esta ação não pode ser desfeita.')) return
        startDelete(async () => {
            const result = await deleteInstagramContent(content.id)
            if (result.error) toast.error(result.error)
            else { toast.success('Conteúdo excluído'); router.refresh() }
        })
    }

    function handleSyncMetrics() {
        startSync(async () => {
            const result = await syncInstagramMetrics(content.id)
            if (result.error) toast.error(result.error)
            else { toast.success('Métricas atualizadas'); router.refresh() }
        })
    }

    const hasMetrics = content.status === 'published' && (content.metrics.likes > 0 || content.metrics.reach > 0)
    const engagementRate = content.metrics.engagement_rate

    return (
        <div className={`bg-card border rounded-(--radius) overflow-hidden transition-colors group ${
            isPendingDelete ? 'opacity-50 pointer-events-none' : 'hover:border-primary/40 border-border'
        }`}>
            {/* Media Preview */}
            <div className="aspect-square bg-muted relative overflow-hidden">
                {content.mediaUrls[0] ? (
                    <Image
                        src={content.mediaUrls[0]}
                        alt={content.caption.slice(0, 50)}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <TypeIcon className="w-12 h-12 text-muted-foreground/20" />
                    </div>
                )}

                {/* Overlays */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-black/60 text-white backdrop-blur-sm rounded-(--radius)">
                        <TypeIcon className="w-3 h-3" />{content.typeLabel}
                    </span>
                </div>
                <div className="absolute top-2 right-2">
                    <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider border rounded-(--radius) ${content.statusColor}`}>
                        {content.statusLabel}
                    </span>
                </div>
                {content.type === 'carousel' && content.mediaUrls.length > 1 && (
                    <div className="absolute bottom-2 right-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm rounded-(--radius) font-mono-data">
                            1/{content.mediaUrls.length}
                        </span>
                    </div>
                )}

                {/* Engagement Rate overlay for published */}
                {engagementRate > 0 && (
                    <div className="absolute bottom-2 left-2">
                        <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-black/70 text-[hsl(var(--success))] backdrop-blur-sm rounded-(--radius) font-mono-data">
                            <TrendingUp className="w-3 h-3" />{engagementRate.toFixed(1)}%
                        </span>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
                {/* Caption */}
                <p className="text-xs text-foreground line-clamp-3 leading-relaxed">
                    {content.caption || <span className="text-muted-foreground italic">Sem legenda</span>}
                </p>

                {/* Hashtags */}
                {content.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {content.hashtags.slice(0, 5).map(h => (
                            <span key={h} className="text-[10px] text-primary/70 font-mono-data">#{h}</span>
                        ))}
                        {content.hashtags.length > 5 && (
                            <span className="text-[10px] text-muted-foreground font-mono-data">+{content.hashtags.length - 5}</span>
                        )}
                    </div>
                )}

                {/* Scheduled at */}
                {content.status === 'scheduled' && content.scheduledAt && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--info))]">
                        <Clock className="w-3 h-3" />
                        {new Date(content.scheduledAt).toLocaleString('pt-BR', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                    </div>
                )}

                {/* Metrics */}
                {hasMetrics && (
                    <div className="pt-2 border-t border-border space-y-2">
                        <div className="flex items-center gap-3">
                            <MetricItem icon={Heart} value={content.metrics.likes} />
                            <MetricItem icon={MessageCircle} value={content.metrics.comments} />
                            <MetricItem icon={Share2} value={content.metrics.shares} />
                            <MetricItem icon={Bookmark} value={content.metrics.saves} />
                            <MetricItem icon={Eye} value={content.metrics.reach} className="ml-auto" />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                    {(content.status === 'draft' || content.status === 'failed') && (
                        <>
                            <Button
                                onClick={handlePublish}
                                disabled={isPendingPublish}
                                size="sm"
                                variant={content.status === 'failed' ? 'destructive' : 'default'}
                                className="h-7 flex-1 text-xs gap-1.5"
                            >
                                <Send className="w-3 h-3" />
                                {isPendingPublish ? 'Publicando...' : content.status === 'failed' ? 'Tentar novamente' : 'Publicar'}
                            </Button>
                            <ScheduleButton contentId={content.id} currentScheduledAt={content.scheduledAt} />
                            <Button
                                onClick={handleDelete}
                                disabled={isPendingDelete}
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </>
                    )}
                    {content.status === 'scheduled' && (
                        <>
                            <Button
                                onClick={handlePublish}
                                disabled={isPendingPublish}
                                size="sm"
                                className="h-7 flex-1 text-xs gap-1.5"
                            >
                                <Send className="w-3 h-3" />
                                Publicar agora
                            </Button>
                            <ScheduleButton contentId={content.id} currentScheduledAt={content.scheduledAt} />
                            <Button
                                onClick={handleDelete}
                                disabled={isPendingDelete}
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </>
                    )}
                    {content.status === 'publishing' && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <RefreshCw className="w-3 h-3 animate-spin" />Publicando...
                        </p>
                    )}
                    {content.status === 'published' && (
                        <div className="flex items-center justify-between w-full">
                            <p className="text-[10px] text-muted-foreground font-mono-data">
                                {content.publishedAt
                                    ? new Date(content.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
                                    : 'Publicado'}
                            </p>
                            <button
                                onClick={handleSyncMetrics}
                                disabled={isPendingSync}
                                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <RefreshCw className={`w-3 h-3 ${isPendingSync ? 'animate-spin' : ''}`} />
                                {isPendingSync ? 'Sincronizando...' : 'Sync métricas'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function MetricItem({ icon: Icon, value, className = '' }: { icon: typeof Heart; value: number; className?: string }) {
    return (
        <span className={`flex items-center gap-0.5 text-[10px] text-muted-foreground font-mono-data ${className}`}>
            <Icon className="w-3 h-3" />{value.toLocaleString('pt-BR')}
        </span>
    )
}

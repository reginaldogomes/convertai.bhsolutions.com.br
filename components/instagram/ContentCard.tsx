'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { publishInstagramContent, deleteInstagramContent } from '@/actions/instagram'
import Image from 'next/image'
import { Image as ImageIcon, Film, Clock, SquareStack, Send, Trash2, Heart, MessageCircle, Share2, Bookmark, Eye } from 'lucide-react'
import { toast } from 'sonner'
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
        createdAt: string
    }
}

export function ContentCard({ content }: ContentCardProps) {
    const [isPendingPublish, startPublish] = useTransition()
    const [isPendingDelete, startDelete] = useTransition()
    const router = useRouter()
    const TypeIcon = TYPE_ICONS[content.type] || ImageIcon

    function handlePublish() {
        startPublish(async () => {
            const result = await publishInstagramContent(content.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Conteúdo publicado no Instagram!')
                router.refresh()
            }
        })
    }

    function handleDelete() {
        if (!confirm('Excluir este conteúdo? Esta ação não pode ser desfeita.')) return
        startDelete(async () => {
            const result = await deleteInstagramContent(content.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Conteúdo excluído')
                router.refresh()
            }
        })
    }

    const hasMetrics = content.status === 'published' && (content.metrics.likes > 0 || content.metrics.reach > 0)

    return (
        <div className={`bg-card border p-0 relative group transition-colors rounded-(--radius) overflow-hidden ${isPendingDelete ? 'opacity-50 pointer-events-none' : 'hover:border-primary/50 border-border'}`}>
            {/* Media Preview */}
            <div className="aspect-square bg-muted relative overflow-hidden">
                {content.mediaUrls[0] ? (
                    <Image
                        src={content.mediaUrls[0]}
                        alt={content.caption.slice(0, 50)}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <TypeIcon className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                )}

                {/* Type Badge */}
                <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-black/60 text-white backdrop-blur-sm rounded-(--radius)">
                        <TypeIcon className="w-3 h-3" />
                        {content.typeLabel}
                    </span>
                </div>

                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                    <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider border rounded-(--radius) ${content.statusColor}`}>
                        {content.statusLabel}
                    </span>
                </div>

                {/* Carousel indicator */}
                {content.type === 'carousel' && content.mediaUrls.length > 1 && (
                    <div className="absolute bottom-2 right-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm rounded-(--radius) font-mono-data">
                            1/{content.mediaUrls.length}
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
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

                {/* Metrics */}
                {hasMetrics && (
                    <div className="flex items-center gap-3 pt-3 border-t border-border">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono-data">
                            <Heart className="w-3 h-3" /> {content.metrics.likes.toLocaleString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono-data">
                            <MessageCircle className="w-3 h-3" /> {content.metrics.comments.toLocaleString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono-data">
                            <Share2 className="w-3 h-3" /> {content.metrics.shares.toLocaleString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono-data">
                            <Bookmark className="w-3 h-3" /> {content.metrics.saves.toLocaleString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono-data ml-auto">
                            <Eye className="w-3 h-3" /> {content.metrics.reach.toLocaleString('pt-BR')}
                        </span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                    {content.status === 'draft' && (
                        <>
                            <button
                                type="button"
                                onClick={handlePublish}
                                disabled={isPendingPublish}
                                className="flex-1 h-8 px-4 bg-primary hover:bg-[hsl(var(--primary-hover))] text-white text-xs font-bold uppercase tracking-wider rounded-(--radius) transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                <Send className="w-3 h-3" />
                                {isPendingPublish ? 'Publicando...' : 'Publicar'}
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isPendingDelete}
                                className="h-8 px-3 border border-border hover:border-[hsl(var(--destructive))] text-destructive text-xs rounded-(--radius) transition-colors inline-flex items-center justify-center disabled:opacity-50"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </>
                    )}
                    {content.status === 'published' && content.publishedAt && (
                        <p className="text-[10px] text-muted-foreground font-mono-data">
                            Publicado em {new Date(content.publishedAt).toLocaleDateString('pt-BR')}
                        </p>
                    )}
                    {content.status === 'failed' && (
                        <button
                            type="button"
                            onClick={handlePublish}
                            disabled={isPendingPublish}
                            className="flex-1 h-8 px-4 bg-destructive hover:bg-destructive/90 text-white text-xs font-bold uppercase tracking-wider rounded-(--radius) transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                            <Send className="w-3 h-3" />
                            Tentar novamente
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

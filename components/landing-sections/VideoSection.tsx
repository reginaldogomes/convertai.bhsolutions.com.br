'use client'

import type { VideoContent } from '@/domain/entities'
import { Container } from '@/components/ui/container'

interface VideoSectionProps {
    content: VideoContent
    isDark: boolean
    primaryColor?: string
}

function getEmbedUrl(url: string, provider: 'youtube' | 'vimeo'): string | null {
    if (!url) return null
    if (provider === 'youtube') {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)
        return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null
    }
    if (provider === 'vimeo') {
        const match = url.match(/vimeo\.com\/(\d+)/)
        return match ? `https://player.vimeo.com/video/${match[1]}` : null
    }
    return null
}

export function VideoSection({ content, isDark, primaryColor }: VideoSectionProps) {
    const embedUrl = getEmbedUrl(content.videoUrl, content.provider)

    if (!embedUrl) return null

    return (
        <section className="bg-background py-24">
            <Container className="max-w-4xl">
                {content.title && (
                    <h2 className="text-2xl md:text-4xl font-black text-center mb-12 tracking-tight text-foreground">
                        {content.title}
                    </h2>
                )}
                <div
                    className={`surface-lift relative rounded-2xl overflow-hidden shadow-2xl ${
                        isDark ? 'ring-1 ring-white/6' : 'ring-1 ring-black/4'
                    }`}
                    style={{
                        paddingBottom: '56.25%',
                        boxShadow: primaryColor ? `0 20px 60px -12px ${primaryColor}15` : undefined,
                    }}
                >
                    <iframe
                        src={embedUrl}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={content.title}
                    />
                </div>
            </Container>
        </section>
    )
}

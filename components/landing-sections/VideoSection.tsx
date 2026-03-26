'use client'

import type { VideoContent } from '@/domain/entities'

interface VideoSectionProps {
    content: VideoContent
    isDark: boolean
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

export function VideoSection({ content, isDark }: VideoSectionProps) {
    const embedUrl = getEmbedUrl(content.videoUrl, content.provider)

    if (!embedUrl) return null

    return (
        <section className={`py-20 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-4xl mx-auto px-6">
                {content.title && (
                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{content.title}</h2>
                )}
                <div className="relative rounded-xl overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                        src={embedUrl}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={content.title}
                    />
                </div>
            </div>
        </section>
    )
}

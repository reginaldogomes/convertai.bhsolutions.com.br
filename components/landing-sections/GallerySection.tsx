'use client'

import type { GalleryContent } from '@/domain/entities'
import { Container } from '@/components/ui/container'

interface GallerySectionProps {
    content: GalleryContent
    isDark: boolean
}

export function GallerySection({ content, isDark }: GallerySectionProps) {
    if (content.images.length === 0) return null

    const colsClass =
        content.columns === 2 ? 'md:grid-cols-2' :
        content.columns === 4 ? 'md:grid-cols-4' :
        'md:grid-cols-3'

    return (
        <section className="bg-background py-24">
            <Container>
                {content.title && (
                    <h2 className="text-2xl md:text-4xl font-black text-center mb-12 tracking-tight text-foreground">
                        {content.title}
                    </h2>
                )}
                <div className={`grid ${colsClass} gap-4`}>
                    {content.images.map((img, idx) => (
                        <div
                            key={idx}
                            className={`group rounded-2xl overflow-hidden aspect-video transition-all duration-300 hover:shadow-lg ${
                                isDark ? 'ring-1 ring-white/6' : 'ring-1 ring-black/4'
                            }`}
                        >
                            <img
                                src={img.url}
                                alt={img.alt}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    )
}

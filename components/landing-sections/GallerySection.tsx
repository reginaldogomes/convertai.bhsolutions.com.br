'use client'

import type { GalleryContent } from '@/domain/entities'

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
        <section className={`py-20 ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-5xl mx-auto px-6">
                {content.title && (
                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{content.title}</h2>
                )}
                <div className={`grid ${colsClass} gap-4`}>
                    {content.images.map((img, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden aspect-video">
                            <img
                                src={img.url}
                                alt={img.alt}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

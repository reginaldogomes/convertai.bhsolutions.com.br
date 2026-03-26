'use client'

import type { StatsContent } from '@/domain/entities'

interface StatsSectionProps {
    content: StatsContent
    primaryColor: string
    isDark: boolean
}

export function StatsSection({ content, primaryColor, isDark }: StatsSectionProps) {
    return (
        <section className={`py-20 ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-5xl mx-auto px-6">
                {content.title && (
                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">{content.title}</h2>
                )}
                <div className={`grid gap-8 ${
                    content.items.length <= 2 ? 'grid-cols-2 max-w-lg mx-auto' :
                    content.items.length === 3 ? 'grid-cols-3' :
                    'grid-cols-2 md:grid-cols-4'
                }`}>
                    {content.items.map((item, idx) => (
                        <div key={idx} className="text-center">
                            <p className="text-3xl md:text-4xl font-bold" style={{ color: primaryColor }}>
                                {item.value}
                            </p>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {item.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

'use client'

import type { StatsContent } from '@/domain/entities'
import type { ColorPalette } from '@/domain/value-objects/design-system'
import { Container } from '@/components/ui/container'

interface StatsSectionProps {
    content: StatsContent
    primaryColor: string
    palette?: ColorPalette
    isDark: boolean
}

export function StatsSection({ content, primaryColor, palette, isDark }: StatsSectionProps) {
    const secondary = palette?.secondary ?? primaryColor
    const cols =
        content.items.length <= 2 ? 'grid-cols-2 max-w-lg mx-auto' :
        content.items.length === 3 ? 'grid-cols-3 max-w-3xl mx-auto' :
        'grid-cols-2 md:grid-cols-4'

    return (
        <section className="relative overflow-hidden bg-background py-20">
            {/* Gradient band */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `linear-gradient(135deg, ${primaryColor}06 0%, transparent 40%, ${primaryColor}04 100%)`,
                }}
                aria-hidden
            />

            <Container className="relative">
                {content.title && (
                    <h2 className="text-balance mb-12 text-center text-2xl font-black tracking-tight text-foreground md:text-4xl">
                        {content.title}
                    </h2>
                )}
                <div className={`grid ${cols} gap-6`}>
                    {content.items.map((item, idx) => (
                        <div
                            key={idx}
                            className={`flex flex-col items-center rounded-2xl px-6 py-8 text-center transition-all duration-300 hover:-translate-y-0.5 ${
                                isDark
                                    ? 'bg-white/[0.03] border border-white/[0.06]'
                                    : 'bg-white/70 border border-black/[0.04]'
                            }`}
                            style={{ backdropFilter: 'blur(12px)' }}
                        >
                            <span
                                className="text-3xl font-black tracking-tight md:text-5xl"
                                style={{
                                    background: `linear-gradient(135deg, ${primaryColor}, ${secondary})`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                {item.value}
                            </span>
                            <span className="mt-3 text-sm font-medium text-muted-foreground">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    )
}

'use client'

import type { StatsContent } from '@/domain/entities'
import { Container } from '@/components/ui/container'

interface StatsSectionProps {
    content: StatsContent
    primaryColor: string
    isDark: boolean
}

export function StatsSection({ content, primaryColor }: StatsSectionProps) {
    const cols =
        content.items.length <= 2 ? 'grid-cols-2 max-w-lg mx-auto' :
        content.items.length === 3 ? 'grid-cols-3 max-w-3xl mx-auto' :
        'grid-cols-2 md:grid-cols-4'

    return (
        <section className="relative overflow-hidden border-y border-border/50 bg-background py-16">
            {/* Subtle primary glow */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(ellipse 80% 50% at 50% 50%, ${primaryColor}0A 0%, transparent 70%)`,
                }}
                aria-hidden
            />
            <Container className="relative">
                {content.title && (
                    <h2 className="text-balance mb-10 text-center text-2xl font-black tracking-tight text-foreground md:text-3xl">
                        {content.title}
                    </h2>
                )}
                <div className={`grid ${cols} gap-0 divide-x divide-border/60`}>
                    {content.items.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center px-6 py-4 text-center">
                            <span
                                className="text-3xl font-black tracking-tight md:text-5xl"
                                style={{ color: primaryColor }}
                            >
                                {item.value}
                            </span>
                            <span className="mt-2 text-sm font-medium text-muted-foreground">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    )
}

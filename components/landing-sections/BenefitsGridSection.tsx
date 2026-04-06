'use client'

import type { BenefitsGridContent } from '@/domain/entities'
import type { ColorPalette } from '@/domain/value-objects/design-system'
import { CheckCircle2 } from 'lucide-react'
import { Container } from '@/components/ui/container'

interface BenefitsGridSectionProps {
    content: BenefitsGridContent
    primaryColor: string
    palette?: ColorPalette
    isDark: boolean
}

export function BenefitsGridSection({ content, primaryColor, palette, isDark }: BenefitsGridSectionProps) {
    const secondary = palette?.secondary ?? primaryColor

    if (!content.items?.length) return null

    return (
        <section className="relative overflow-hidden py-24">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(circle at 20% 20%, ${primaryColor}14 0%, transparent 35%), radial-gradient(circle at 80% 80%, ${secondary}14 0%, transparent 35%)`,
                }}
            />

            <Container className="relative">
                <div className="mx-auto mb-14 max-w-3xl text-center">
                    <h2 className="text-balance text-3xl font-black tracking-tight text-foreground md:text-5xl">
                        {content.title}
                    </h2>
                    {content.subtitle && (
                        <p className="mt-4 text-pretty text-base text-muted-foreground md:text-lg">
                            {content.subtitle}
                        </p>
                    )}
                </div>

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {content.items.slice(0, 6).map((item, index) => (
                        <article
                            key={`${item.title}-${index}`}
                            className={`surface-lift relative rounded-3xl p-6 md:p-7 ${
                                isDark
                                    ? 'surface-glass border-white/12'
                                    : 'surface-glass border-black/8'
                            }`}
                        >
                            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${primaryColor}20` }}>
                                <CheckCircle2 className="h-5 w-5" style={{ color: primaryColor }} />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                        </article>
                    ))}
                </div>
            </Container>
        </section>
    )
}

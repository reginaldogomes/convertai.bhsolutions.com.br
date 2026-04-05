'use client'

import type { ProcessStepsContent } from '@/domain/entities'
import type { ColorPalette } from '@/domain/value-objects/design-system'
import { Container } from '@/components/ui/container'

interface ProcessStepsSectionProps {
    content: ProcessStepsContent
    primaryColor: string
    palette?: ColorPalette
    isDark: boolean
}

export function ProcessStepsSection({ content, primaryColor, palette, isDark }: ProcessStepsSectionProps) {
    const accent = palette?.accent ?? primaryColor

    if (!content.steps?.length) return null

    return (
        <section className="relative bg-background-secondary py-24">
            <Container>
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

                <ol className="relative mx-auto max-w-4xl space-y-5">
                    {content.steps.slice(0, 5).map((step, index) => (
                        <li
                            key={`${step.title}-${index}`}
                            className={`relative rounded-2xl border p-5 md:p-6 ${
                                isDark ? 'border-white/10 bg-white/4' : 'border-black/8 bg-white/80'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                                    style={{ backgroundColor: accent }}
                                >
                                    {index + 1}
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-foreground md:text-lg">{step.title}</h3>
                                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ol>
            </Container>
        </section>
    )
}

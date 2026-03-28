'use client'

import type { PricingContent } from '@/domain/entities'
import { Check, Sparkles } from 'lucide-react'
import { Container } from '@/components/ui/container'

interface PricingSectionProps {
    content: PricingContent
    primaryColor: string
    isDark: boolean
}

export function PricingSection({ content, primaryColor }: PricingSectionProps) {
    return (
        <section className="bg-background-secondary py-20">
            <Container>
                {content.title && (
                    <h2 className="text-balance mb-3 text-center text-2xl font-black tracking-tight text-foreground md:text-3xl">
                        {content.title}
                    </h2>
                )}
                {content.subtitle && (
                    <p className="mx-auto mb-12 max-w-xl text-center text-base text-muted-foreground">
                        {content.subtitle}
                    </p>
                )}
                <div
                    className={`grid gap-6 ${
                        content.tiers.length === 1
                            ? 'max-w-sm mx-auto'
                            : content.tiers.length === 2
                                ? 'md:grid-cols-2 max-w-2xl mx-auto'
                                : 'md:grid-cols-3'
                    }`}
                >
                    {content.tiers.map((tier, idx) => (
                        <div
                            key={idx}
                            className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200 ${
                                tier.highlighted
                                    ? 'border-primary/50 bg-card shadow-lg shadow-primary/10 scale-[1.03]'
                                    : 'border-border/70 bg-card hover:-translate-y-0.5 hover:border-border'
                            }`}
                        >
                            {tier.highlighted && (
                                <div
                                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-sm"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <Sparkles className="w-3 h-3" aria-hidden />
                                    Mais Popular
                                </div>
                            )}

                            <div className="mb-5">
                                <h3 className="text-base font-black text-foreground">{tier.name}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
                            </div>

                            <div className="mb-6 flex items-end gap-1">
                                <span className="text-4xl font-black tracking-tight text-foreground">{tier.price}</span>
                                {tier.period && (
                                    <span className="mb-1 text-sm text-muted-foreground">{tier.period}</span>
                                )}
                            </div>

                            <ul className="mb-7 flex-1 space-y-2.5">
                                {tier.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                                        <Check
                                            className="mt-0.5 h-4 w-4 shrink-0"
                                            style={{ color: primaryColor }}
                                            aria-hidden
                                        />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`w-full rounded-xl py-2.5 text-sm font-bold transition-opacity hover:opacity-90 ${
                                    tier.highlighted ? 'text-white' : 'bg-accent text-foreground hover:bg-muted'
                                }`}
                                style={tier.highlighted ? { backgroundColor: primaryColor } : undefined}
                            >
                                {tier.ctaText}
                            </button>
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    )
}

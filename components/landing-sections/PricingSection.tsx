'use client'

import type { PricingContent } from '@/domain/entities'
import type { ColorPalette } from '@/domain/value-objects/design-system'
import { Check, Sparkles } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { getContrastTextColor } from '@/lib/utils'

interface PricingSectionProps {
    content: PricingContent
    primaryColor: string
    palette?: ColorPalette
    isDark: boolean
}

export function PricingSection({ content, primaryColor, palette, isDark }: PricingSectionProps) {
    const secondary = palette?.secondary ?? primaryColor
    const accent = palette?.accent ?? primaryColor
    return (
        <section className="relative bg-background-secondary py-24 overflow-hidden">
            {/* Decorative glow */}
            <div
                className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-125 w-125 rounded-full blur-[180px] opacity-25"
                style={{ backgroundColor: secondary }}
                aria-hidden
            />

            <Container className="relative">
                {content.title && (
                    <h2 className="text-balance mb-4 text-center text-3xl font-black tracking-tight text-foreground md:text-4xl">
                        {content.title}
                    </h2>
                )}
                {content.subtitle && (
                    <p className="mx-auto mb-14 max-w-xl text-center text-base leading-relaxed text-muted-foreground">
                        {content.subtitle}
                    </p>
                )}
                <div
                    className={`grid gap-6 items-start ${
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
                            className={`relative flex flex-col rounded-2xl p-7 transition-all duration-300 ${
                                tier.highlighted
                                    ? `${isDark ? 'surface-glass border-2 border-white/15' : 'surface-glass border-2 border-black/10'} shadow-xl scale-[1.03]`
                                    : `${isDark ? 'surface-glass border border-white/10' : 'surface-glass border border-black/6'} surface-lift`
                            }`}
                            style={{
                                borderColor: tier.highlighted ? `${primaryColor}50` : undefined,
                                boxShadow: tier.highlighted ? `0 20px 60px -12px ${primaryColor}20` : undefined,
                            }}
                        >
                            {tier.highlighted && (
                                <div
                                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest shadow-lg"
                                    style={{
                                        background: `linear-gradient(135deg, ${primaryColor}, ${secondary})`,
                                        color: getContrastTextColor(primaryColor),
                                        boxShadow: `0 4px 14px ${primaryColor}40`,
                                    }}
                                >
                                    <Sparkles className="w-3 h-3" aria-hidden />
                                    Mais Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-base font-bold text-foreground">{tier.name}</h3>
                                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{tier.description}</p>
                            </div>

                            <div className="mb-7 flex items-end gap-1">
                                <span className="text-4xl font-black tracking-tight text-foreground md:text-5xl">{tier.price}</span>
                                {tier.period && (
                                    <span className="mb-1.5 text-sm text-muted-foreground">{tier.period}</span>
                                )}
                            </div>

                            <ul className="mb-8 flex-1 space-y-3">
                                {tier.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                                        <div
                                            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                                            style={{ backgroundColor: `${primaryColor}15` }}
                                        >
                                            <Check
                                                className="h-3 w-3"
                                                style={{ color: primaryColor }}
                                                aria-hidden
                                            />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`w-full rounded-xl py-3 text-sm font-bold transition-all duration-200 ${
                                    tier.highlighted
                                        ? `shadow-lg hover:shadow-xl hover:scale-[1.01]`
                                        : `${isDark ? 'bg-white/6 hover:bg-white/10' : 'bg-black/4 hover:bg-black/[0.07]'} text-foreground`
                                }`}
                                style={tier.highlighted ? {
                                    backgroundColor: primaryColor,
                                    color: getContrastTextColor(primaryColor),
                                    boxShadow: `0 4px 14px ${primaryColor}30`,
                                } : undefined}
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

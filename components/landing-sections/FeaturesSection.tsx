'use client'

import type { FeaturesContent } from '@/domain/entities'
import type { ColorPalette } from '@/domain/value-objects/design-system'
import { Zap, Shield, Headphones, Star, Target, Clock, CheckCircle, Globe, Heart, Lightbulb, Rocket, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Container } from '@/components/ui/container'

const ICON_MAP: Record<string, LucideIcon> = {
    Zap, Shield, Headphones: Headphones, HeadphonesIcon: Headphones,
    Star, Target, Clock, CheckCircle, Globe, Heart, Lightbulb, Rocket, Users,
}

interface FeaturesSectionProps {
    content: FeaturesContent
    primaryColor: string
    palette?: ColorPalette
    isDark: boolean
}

export function FeaturesSection({ content, primaryColor, palette, isDark }: FeaturesSectionProps) {
    const secondary = palette?.secondary ?? primaryColor
    const accent = palette?.accent ?? primaryColor
    const colsClass =
        content.columns === 2 ? 'md:grid-cols-2' :
        content.columns === 4 ? 'md:grid-cols-4' :
        'md:grid-cols-3'

    return (
        <section className="relative bg-background-secondary py-24 overflow-hidden">
            {/* Decorative accent blob */}
            <div
                className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-105 w-105 rounded-full blur-[160px] opacity-30"
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
                <div className={`grid ${colsClass} gap-5`}>
                    {content.items.map((item, idx) => {
                        const Icon = ICON_MAP[item.icon] ?? Zap
                        return (
                            <div
                                key={idx}
                                className={`group surface-lift relative rounded-2xl p-6 ${
                                    isDark
                                        ? 'surface-glass border-white/12'
                                        : 'surface-glass border-black/6'
                                }`}
                            >
                                {/* Icon with gradient bg */}
                                <div
                                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                                    style={{
                                        background: `linear-gradient(135deg, ${primaryColor}20, ${secondary}08)`,
                                        boxShadow: `inset 0 1px 0 ${primaryColor}15`,
                                    }}
                                >
                                    <Icon className="h-5 w-5" style={{ color: primaryColor }} />
                                </div>
                                <h3 className="mb-2 text-base font-bold text-foreground">{item.title}</h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                            </div>
                        )
                    })}
                </div>
            </Container>
        </section>
    )
}

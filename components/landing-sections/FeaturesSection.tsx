'use client'

import type { FeaturesContent } from '@/domain/entities'
import { Zap, Shield, Headphones, Star, Target, Clock, CheckCircle, Globe, Heart, Lightbulb, Rocket, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Card, CardContent } from '@/components/ui/card'

const ICON_MAP: Record<string, LucideIcon> = {
    Zap, Shield, Headphones: Headphones, HeadphonesIcon: Headphones,
    Star, Target, Clock, CheckCircle, Globe, Heart, Lightbulb, Rocket, Users,
}

interface FeaturesSectionProps {
    content: FeaturesContent
    primaryColor: string
    isDark: boolean
}

export function FeaturesSection({ content, primaryColor, isDark }: FeaturesSectionProps) {
    void isDark

    const colsClass =
        content.columns === 2 ? 'md:grid-cols-2' :
        content.columns === 4 ? 'md:grid-cols-4' :
        'md:grid-cols-3'

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
                <div className={`grid ${colsClass} gap-5`}>
                    {content.items.map((item, idx) => {
                        const Icon = ICON_MAP[item.icon] ?? Zap
                        return (
                            <Card
                                key={idx}
                                className="group rounded-2xl border-border/70 bg-card py-0 transition-all duration-200 hover:-translate-y-1"
                            >
                                <CardContent className="p-6">
                                    <div
                                        className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                                        style={{ backgroundColor: `${primaryColor}1F` }}
                                    >
                                        <Icon className="h-5 w-5" style={{ color: primaryColor }} />
                                    </div>
                                    <h3 className="mb-2 text-base font-semibold text-foreground">{item.title}</h3>
                                    <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </Container>
        </section>
    )
}

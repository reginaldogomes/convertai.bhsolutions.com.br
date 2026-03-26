'use client'

import type { CtaBannerContent } from '@/domain/entities'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface CtaBannerSectionProps {
    content: CtaBannerContent
    primaryColor: string
    isDark: boolean
}

export function CtaBannerSection({ content, primaryColor, isDark }: CtaBannerSectionProps) {
    void isDark

    return (
        <section
            className="relative overflow-hidden border-y border-border/60 py-20"
            style={{ backgroundColor: `${primaryColor}0A` }}
        >
            {/* Gradient glow */}
            <div
                className="absolute inset-0"
                style={{
                    background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${primaryColor}12 0%, transparent 65%)`,
                }}
            />
            {/* Dot grid */}
            <div className="bg-dot-grid absolute inset-0 opacity-[0.04]" />

            <Container className="relative max-w-3xl text-center">
                <h2 className="text-balance mb-4 text-2xl font-black tracking-tight text-foreground md:text-4xl">
                    {content.title}
                </h2>
                {content.subtitle && (
                    <p className="mx-auto mb-10 max-w-lg text-base text-muted-foreground">
                        {content.subtitle}
                    </p>
                )}
                <Button
                    asChild
                    size="lg"
                    className="group rounded-xl px-8"
                    style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                >
                    <a href={content.ctaUrl || '#'}>
                        {content.ctaText}
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </a>
                </Button>
            </Container>
        </section>
    )
}

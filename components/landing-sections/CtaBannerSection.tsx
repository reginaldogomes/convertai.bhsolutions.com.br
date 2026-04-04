'use client'

import type { CtaBannerContent } from '@/domain/entities'
import type { ColorPalette } from '@/domain/value-objects/design-system'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface CtaBannerSectionProps {
    content: CtaBannerContent
    primaryColor: string
    palette?: ColorPalette
    isDark: boolean
}

export function CtaBannerSection({ content, primaryColor, palette, isDark }: CtaBannerSectionProps) {
    const secondary = palette?.secondary ?? primaryColor
    return (
        <section className="relative overflow-hidden py-24">
            {/* Multi-layer gradient background */}
            <div
                className="absolute inset-0"
                style={{
                    background: isDark
                        ? `linear-gradient(135deg, ${primaryColor}12 0%, transparent 40%, ${primaryColor}08 100%)`
                        : `linear-gradient(135deg, ${primaryColor}0A 0%, ${primaryColor}04 50%, ${primaryColor}08 100%)`,
                }}
            />
            {/* Floating orb */}
            <div
                className="pointer-events-none absolute top-1/2 right-[10%] -translate-y-1/2 h-64 w-64 rounded-full blur-[120px] opacity-20"
                style={{ backgroundColor: secondary }}
                aria-hidden
            />
            {/* Grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(128,128,128,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(128,128,128,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

            <Container className="relative max-w-3xl text-center">
                <h2 className="text-balance mb-5 text-2xl font-black tracking-tight text-foreground md:text-4xl lg:text-5xl">
                    {content.title}
                </h2>
                {content.subtitle && (
                    <p className="mx-auto mb-12 max-w-lg text-base leading-relaxed text-muted-foreground">
                        {content.subtitle}
                    </p>
                )}
                <Button
                    asChild
                    size="lg"
                    className="group h-13 rounded-2xl px-8 text-base font-bold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                    style={{
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                        boxShadow: `0 8px 32px ${primaryColor}30`,
                    }}
                >
                    <a href={content.ctaUrl || '#'}>
                        {content.ctaText}
                        <ArrowRight className="h-4 w-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
                    </a>
                </Button>
            </Container>
        </section>
    )
}

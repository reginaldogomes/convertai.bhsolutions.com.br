'use client'

import type { HeroContent } from '@/domain/entities'
import type { ColorPalette } from '@/domain/value-objects/design-system'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'

interface HeroSectionProps {
    content: HeroContent
    primaryColor: string
    palette?: ColorPalette
    isDark: boolean
    onCtaClick?: () => void
}

export function HeroSection({ content, primaryColor, palette, isDark, onCtaClick }: HeroSectionProps) {
    const secondary = palette?.secondary ?? primaryColor
    const accent = palette?.accent ?? primaryColor
    const isCentered = !content.alignment || content.alignment === 'center'
    return (
        <header className="relative min-h-[85vh] flex items-center overflow-hidden bg-background">
            {/* Background layers */}
            {content.backgroundImageUrl ? (
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${content.backgroundImageUrl})` }}
                >
                    <div className={`absolute inset-0 ${isDark ? 'bg-background/80' : 'bg-background/85'} backdrop-blur-sm`} />
                </div>
            ) : (
                <>
                    {/* Multi-layer gradient mesh */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `
                                radial-gradient(ellipse 80% 50% at 20% 0%, ${primaryColor}15 0%, transparent 50%),
                                radial-gradient(ellipse 60% 40% at 80% 100%, ${secondary}0C 0%, transparent 50%),
                                radial-gradient(circle at 50% 50%, ${accent}06 0%, transparent 70%)
                            `,
                        }}
                    />
                    {/* Subtle grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(128,128,128,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(128,128,128,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
                    {/* Floating orb accent */}
                    <div
                        className="absolute top-1/4 right-[15%] h-72 w-72 rounded-full blur-[120px] opacity-20"
                        style={{ backgroundColor: secondary }}
                    />
                </>
            )}

            {/* Content */}
            <Container
                className={`relative z-10 py-28 md:py-36 ${
                    isCentered ? 'text-center' : 'text-left max-w-4xl'
                }`}
            >
                {/* Badge */}
                <div
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide mb-8 ${
                        isCentered ? 'mx-auto' : ''
                    }`}
                    style={{
                        borderColor: `${accent}30`,
                        color: accent,
                        backgroundColor: `${accent}08`,
                    }}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    Descubra a diferença
                </div>

                <h1 className="text-balance mb-6 text-4xl font-black leading-[1.02] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                    {content.headline}
                </h1>
                {content.subheadline && (
                    <p
                        className={`text-pretty mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl ${
                            isCentered ? 'mx-auto' : ''
                        }`}
                    >
                        {content.subheadline}
                    </p>
                )}
                {content.ctaText && (
                    <div className={`flex items-center gap-4 ${isCentered ? 'justify-center' : ''}`}>
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
                            <a href={content.ctaUrl || '#'} onClick={onCtaClick}>
                                {content.ctaText}
                                <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
                            </a>
                        </Button>
                    </div>
                )}
            </Container>

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </header>
    )
}

'use client'

import type { HeroContent } from '@/domain/entities'
import type { ColorPalette } from '@/domain/value-objects/design-system'
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'
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
    const trustBadges = Array.isArray(content.trustBadges) ? content.trustBadges.filter(Boolean).slice(0, 4) : []

    return (
        <header className="relative overflow-hidden bg-background">
            {/* Background layers */}
            {content.backgroundImageUrl ? (
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${content.backgroundImageUrl})` }}
                >
                    <div className={`absolute inset-0 ${isDark ? 'bg-background/78' : 'bg-background/80'} backdrop-blur-sm`} />
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
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(128,128,128,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(128,128,128,0.03)_1px,transparent_1px)] bg-size-[64px_64px]" />
                    {/* Floating orb accent */}
                    <div
                        className="absolute top-1/4 right-[15%] h-72 w-72 rounded-full blur-[120px] opacity-20"
                        style={{ backgroundColor: secondary }}
                    />
                </>
            )}

            {/* Content */}
            <Container
                className={`relative z-10 grid gap-10 py-20 md:py-28 lg:py-32 ${
                    content.heroImageUrl ? 'items-center lg:grid-cols-[1.05fr_0.95fr]' : ''
                }`}
            >
                <div className={isCentered ? 'text-center' : 'text-left'}>
                    <div
                        className={`mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide ${
                            isCentered ? 'mx-auto' : ''
                        }`}
                        style={{
                            borderColor: `${accent}30`,
                            color: accent,
                            backgroundColor: `${accent}0F`,
                        }}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        {content.kicker || 'Descubra a diferença'}
                    </div>

                    <h1 className="text-balance mb-6 text-4xl font-black leading-[1.02] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                        {content.headline}
                    </h1>
                    {content.subheadline && (
                        <p
                            className={`text-pretty mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl ${
                                isCentered ? 'mx-auto' : ''
                            }`}
                        >
                            {content.subheadline}
                        </p>
                    )}

                    {content.ctaText && (
                        <div className={`mb-8 flex flex-wrap items-center gap-3 ${isCentered ? 'justify-center' : ''}`}>
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

                            <a
                                href="#faq"
                                className="inline-flex h-13 items-center justify-center rounded-2xl border px-6 text-sm font-semibold text-foreground/90 transition hover:bg-foreground/5"
                            >
                                Ver detalhes
                            </a>
                        </div>
                    )}

                    {trustBadges.length > 0 && (
                        <ul className={`flex flex-wrap gap-2.5 ${isCentered ? 'justify-center' : ''}`}>
                            {trustBadges.map((badge, index) => (
                                <li
                                    key={`${badge}-${index}`}
                                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
                                    style={{ borderColor: `${primaryColor}26`, backgroundColor: `${primaryColor}0A` }}
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                                    {badge}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {content.heroImageUrl && (
                    <div className="relative mx-auto w-full max-w-xl">
                        <div
                            className="pointer-events-none absolute -inset-6 rounded-4xl blur-3xl"
                            style={{ background: `radial-gradient(circle, ${secondary}30 0%, transparent 70%)` }}
                        />
                        <div className="relative aspect-4/3 overflow-hidden rounded-4xl border border-border/40 bg-card/40 shadow-2xl backdrop-blur">
                            <img
                                src={content.heroImageUrl}
                                alt="Destaque visual da oferta"
                                loading="eager"
                                fetchPriority="high"
                                decoding="async"
                                className="h-full w-full object-cover"
                            />
                        </div>
                    </div>
                )}
            </Container>

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-background to-transparent" />
        </header>
    )
}

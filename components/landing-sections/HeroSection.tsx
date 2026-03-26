'use client'

import type { HeroContent } from '@/domain/entities'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'

interface HeroSectionProps {
    content: HeroContent
    primaryColor: string
    isDark: boolean
    onCtaClick?: () => void
}

export function HeroSection({ content, primaryColor, isDark, onCtaClick }: HeroSectionProps) {
    const isCentered = !content.alignment || content.alignment === 'center'
    return (
        <header className="gradient-mesh relative overflow-hidden border-b border-border/60 bg-background">
            {/* Background layers */}
            {content.backgroundImageUrl ? (
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${content.backgroundImageUrl})` }}
                >
                    <div className={`absolute inset-0 ${isDark ? 'bg-background/75' : 'bg-background/80'} backdrop-blur-[2px]`} />
                </div>
            ) : (
                <>
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `radial-gradient(ellipse 90% 60% at 50% -5%, ${primaryColor}18 0%, transparent 65%)`,
                        }}
                    />
                    <div className="bg-dot-grid absolute inset-0 opacity-[0.03]" />
                </>
            )}

            {/* Content */}
            <Container
                className={`relative py-24 md:py-32 ${
                    isCentered ? 'text-center' : 'text-left'
                }`}
            >
                <h1
                    className="text-balance mb-6 text-4xl font-black leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl"
                >
                    {content.headline}
                </h1>
                {content.subheadline && (
                    <p
                        className={`text-pretty mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-xl ${
                            isCentered ? 'mx-auto' : ''
                        }`}
                    >
                        {content.subheadline}
                    </p>
                )}
                {content.ctaText && (
                    <Button
                        asChild
                        size="lg"
                        className="group rounded-xl px-7"
                        style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                    >
                        <a href={content.ctaUrl || '#'} onClick={onCtaClick}>
                            {content.ctaText}
                            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </a>
                    </Button>
                )}
            </Container>
        </header>
    )
}

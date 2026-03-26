'use client'

import type { HeroContent } from '@/domain/entities'
import { ArrowRight } from 'lucide-react'

interface HeroSectionProps {
    content: HeroContent
    primaryColor: string
    isDark: boolean
    onCtaClick?: () => void
}

export function HeroSection({ content, primaryColor, isDark, onCtaClick }: HeroSectionProps) {
    const isCentered = !content.alignment || content.alignment === 'center'
    return (
        <header className={`relative overflow-hidden ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            {/* Background layers */}
            {content.backgroundImageUrl ? (
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${content.backgroundImageUrl})` }}
                >
                    <div className={`absolute inset-0 ${isDark ? 'bg-black/65' : 'bg-white/70'} backdrop-blur-[1px]`} />
                </div>
            ) : (
                <>
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `radial-gradient(ellipse 90% 60% at 50% -5%, ${primaryColor}18 0%, transparent 65%)`,
                        }}
                    />
                    <div className={`absolute inset-0 bg-dot-grid ${isDark ? 'opacity-[0.04]' : 'opacity-[0.035]'}`} />
                </>
            )}

            {/* Content */}
            <div
                className={`relative max-w-5xl mx-auto px-6 py-28 md:py-36 ${
                    isCentered ? 'text-center' : 'text-left'
                }`}
            >
                <h1
                    className={`text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] mb-6 text-balance ${
                        isDark ? 'text-white' : 'text-gray-950'
                    }`}
                >
                    {content.headline}
                </h1>
                {content.subheadline && (
                    <p
                        className={`text-lg md:text-xl max-w-2xl mb-10 leading-relaxed text-pretty ${
                            isCentered ? 'mx-auto' : ''
                        } ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                        {content.subheadline}
                    </p>
                )}
                {content.ctaText && (
                    <a
                        href={content.ctaUrl || '#'}
                        onClick={onCtaClick}
                        className="group inline-flex items-center gap-2.5 px-7 py-3.5 text-base font-semibold rounded-xl text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                        style={{
                            backgroundColor: primaryColor,
                            boxShadow: `0 8px 24px -4px ${primaryColor}55`,
                        }}
                    >
                        {content.ctaText}
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </a>
                )}
            </div>
        </header>
    )
}

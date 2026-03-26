'use client'

import type { CtaBannerContent } from '@/domain/entities'

interface CtaBannerSectionProps {
    content: CtaBannerContent
    primaryColor: string
    isDark: boolean
}

export function CtaBannerSection({ content, primaryColor, isDark }: CtaBannerSectionProps) {
    return (
        <section
            className="py-20 relative overflow-hidden"
            style={{ backgroundColor: isDark ? '#0c0f14' : `${primaryColor}06` }}
        >
            {/* Gradient glow */}
            <div
                className="absolute inset-0"
                style={{
                    background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${primaryColor}12 0%, transparent 65%)`,
                }}
            />
            {/* Dot grid */}
            <div className={`absolute inset-0 bg-dot-grid ${isDark ? 'opacity-[0.04]' : 'opacity-[0.06]'}`} />

            <div className="relative max-w-3xl mx-auto px-6 text-center">
                <h2 className={`text-2xl md:text-4xl font-black tracking-tight mb-4 text-balance ${
                    isDark ? 'text-white' : 'text-gray-950'
                }`}>
                    {content.title}
                </h2>
                {content.subtitle && (
                    <p className={`text-base mb-10 max-w-lg mx-auto ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                        {content.subtitle}
                    </p>
                )}
                <a
                    href={content.ctaUrl || '#'}
                    className="group inline-flex items-center gap-2.5 px-8 py-4 text-base font-semibold rounded-xl text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                    style={{
                        backgroundColor: primaryColor,
                        boxShadow: `0 10px 30px -4px ${primaryColor}55`,
                    }}
                >
                    {content.ctaText}
                    <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </a>
            </div>
        </section>
    )
}

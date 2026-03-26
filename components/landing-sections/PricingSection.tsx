'use client'

import type { PricingContent } from '@/domain/entities'
import { Check } from 'lucide-react'

interface PricingSectionProps {
    content: PricingContent
    primaryColor: string
    isDark: boolean
}

export function PricingSection({ content, primaryColor, isDark }: PricingSectionProps) {
    return (
        <section className={`py-20 ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-5xl mx-auto px-6">
                {content.title && (
                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">{content.title}</h2>
                )}
                {content.subtitle && (
                    <p className={`text-center text-base mb-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {content.subtitle}
                    </p>
                )}
                <div className={`grid gap-6 ${
                    content.tiers.length === 1 ? 'max-w-sm mx-auto' :
                    content.tiers.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' :
                    'md:grid-cols-3'
                }`}>
                    {content.tiers.map((tier, idx) => (
                        <div
                            key={idx}
                            className={`p-6 rounded-xl flex flex-col ${
                                tier.highlighted
                                    ? 'ring-2 scale-[1.02]'
                                    : isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                            }`}
                            style={tier.highlighted ? {
                                borderColor: primaryColor,
                                border: `2px solid ${primaryColor}`,
                                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                            } : undefined}
                        >
                            {tier.highlighted && (
                                <div
                                    className="text-xs font-semibold text-white px-3 py-1 rounded-full self-start mb-4"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    Mais Popular
                                </div>
                            )}
                            <h3 className="text-lg font-bold">{tier.name}</h3>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{tier.description}</p>
                            <div className="mt-4 mb-6">
                                <span className="text-3xl font-bold">{tier.price}</span>
                                {tier.period && <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{tier.period}</span>}
                            </div>
                            <ul className="space-y-2 mb-6 flex-1">
                                {tier.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <Check className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                className={`w-full py-3 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 ${
                                    tier.highlighted
                                        ? 'text-white'
                                        : isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'
                                }`}
                                style={tier.highlighted ? { backgroundColor: primaryColor } : undefined}
                            >
                                {tier.ctaText}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

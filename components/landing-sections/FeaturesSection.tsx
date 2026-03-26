'use client'

import type { FeaturesContent } from '@/domain/entities'
import { Zap, Shield, Headphones, Star, Target, Clock, CheckCircle, Globe, Heart, Lightbulb, Rocket, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

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
    const colsClass =
        content.columns === 2 ? 'md:grid-cols-2' :
        content.columns === 4 ? 'md:grid-cols-4' :
        'md:grid-cols-3'

    return (
        <section className={`py-20 ${isDark ? 'bg-gray-900/60' : 'bg-gray-50/80'}`}>
            <div className="max-w-5xl mx-auto px-6">
                {content.title && (
                    <h2 className={`text-2xl md:text-3xl font-black tracking-tight text-center mb-3 text-balance ${
                        isDark ? 'text-white' : 'text-gray-950'
                    }`}>
                        {content.title}
                    </h2>
                )}
                {content.subtitle && (
                    <p className={`text-center text-base mb-12 max-w-xl mx-auto ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                        {content.subtitle}
                    </p>
                )}
                <div className={`grid ${colsClass} gap-5`}>
                    {content.items.map((item, idx) => {
                        const Icon = ICON_MAP[item.icon] ?? Zap
                        return (
                            <div
                                key={idx}
                                className={`group p-6 rounded-2xl border transition-all duration-200 hover:-translate-y-1 ${
                                    isDark
                                        ? 'bg-gray-800/70 border-gray-700/60 hover:border-gray-600 hover:bg-gray-800'
                                        : 'bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-md'
                                }`}
                            >
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110"
                                    style={{ backgroundColor: `${primaryColor}18` }}
                                >
                                    <Icon className="w-5 h-5" style={{ color: primaryColor }} />
                                </div>
                                <h3 className={`font-semibold text-base mb-2 ${
                                    isDark ? 'text-white' : 'text-gray-900'
                                }`}>
                                    {item.title}
                                </h3>
                                <p className={`text-sm leading-relaxed ${
                                    isDark ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                    {item.description}
                                </p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

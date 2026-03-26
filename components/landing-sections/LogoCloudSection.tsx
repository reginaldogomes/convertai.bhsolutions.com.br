'use client'

import type { LogoCloudContent } from '@/domain/entities'

interface LogoCloudSectionProps {
    content: LogoCloudContent
    isDark: boolean
}

export function LogoCloudSection({ content, isDark }: LogoCloudSectionProps) {
    if (content.logos.length === 0) return null

    return (
        <section className={`py-16 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-5xl mx-auto px-6">
                {content.title && (
                    <p className={`text-center text-sm font-medium uppercase tracking-wider mb-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {content.title}
                    </p>
                )}
                <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                    {content.logos.map((logo, idx) => (
                        <img
                            key={idx}
                            src={logo.imageUrl}
                            alt={logo.name}
                            className={`h-8 md:h-10 object-contain ${isDark ? 'opacity-60 hover:opacity-100' : 'opacity-50 hover:opacity-100'} transition-opacity`}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

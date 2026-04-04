'use client'

import type { LogoCloudContent } from '@/domain/entities'
import { Container } from '@/components/ui/container'

interface LogoCloudSectionProps {
    content: LogoCloudContent
    isDark: boolean
}

export function LogoCloudSection({ content, isDark }: LogoCloudSectionProps) {
    if (content.logos.length === 0) return null

    return (
        <section className="bg-background-secondary py-16">
            <Container>
                {content.title && (
                    <p className="text-center text-sm font-medium uppercase tracking-wider mb-10 text-muted-foreground">
                        {content.title}
                    </p>
                )}
                <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
                    {content.logos.map((logo, idx) => (
                        <img
                            key={idx}
                            src={logo.imageUrl}
                            alt={logo.name}
                            className={`h-8 md:h-10 object-contain transition-all duration-300 ${
                                isDark ? 'opacity-40 hover:opacity-90 brightness-200 grayscale hover:grayscale-0 hover:brightness-100' : 'opacity-40 hover:opacity-90 grayscale hover:grayscale-0'
                            }`}
                        />
                    ))}
                </div>
            </Container>
        </section>
    )
}

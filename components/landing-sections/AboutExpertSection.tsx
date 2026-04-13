'use client'

import type { AboutExpertContent } from '@/domain/entities'
import type { ColorPalette } from '@/domain/value-objects/design-system'
import { BadgeCheck, ExternalLink, User } from 'lucide-react'
import { getContrastTextColor } from '@/lib/utils'
import { Container } from '@/components/ui/container'

interface AboutExpertSectionProps {
    content: AboutExpertContent
    primaryColor: string
    palette?: ColorPalette
    isDark: boolean
}

export function AboutExpertSection({ content, primaryColor, palette, isDark }: AboutExpertSectionProps) {
    const secondary = palette?.secondary ?? primaryColor
    const accent = palette?.accent ?? primaryColor

    const initials = content.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('')

    const credentials = Array.isArray(content.credentials)
        ? content.credentials.filter(Boolean)
        : []

    const hasLearnMore = !!content.learnMoreUrl && content.learnMoreUrl !== '#'

    return (
        <section className="relative bg-background py-24 overflow-hidden">
            {/* Decorative orbs */}
            <div
                className="pointer-events-none absolute top-0 left-[5%] h-72 w-72 rounded-full blur-[140px] opacity-25"
                style={{ backgroundColor: primaryColor }}
                aria-hidden
            />
            <div
                className="pointer-events-none absolute bottom-0 right-[5%] h-56 w-56 rounded-full blur-[120px] opacity-20"
                style={{ backgroundColor: secondary }}
                aria-hidden
            />

            <Container>
                {/* Section heading */}
                {content.sectionTitle && (
                    <p
                        className="mb-10 text-center text-xs font-bold uppercase tracking-[0.18em]"
                        style={{ color: accent }}
                    >
                        {content.sectionTitle}
                    </p>
                )}

                <div
                    className={`relative mx-auto max-w-4xl rounded-3xl p-8 md:p-12 lg:flex lg:items-center lg:gap-14 ${
                        isDark
                            ? 'bg-white/3 border border-white/10'
                            : 'bg-black/2 border border-black/6'
                    }`}
                    style={{ boxShadow: `0 8px 48px ${primaryColor}0D` }}
                >
                    {/* Subtle inner glow */}
                    <div
                        className="pointer-events-none absolute inset-0 rounded-3xl opacity-[0.04]"
                        style={{
                            background: `radial-gradient(ellipse 70% 60% at 0% 0%, ${primaryColor}, transparent)`,
                        }}
                        aria-hidden
                    />

                    {/* Avatar column */}
                    <div className="relative mb-8 flex flex-col items-center gap-4 shrink-0 lg:mb-0 lg:items-start">
                        {content.avatarUrl ? (
                            <img
                                src={content.avatarUrl}
                                alt={content.name}
                                className="h-36 w-36 rounded-2xl object-cover ring-4"
                                style={{ ringColor: `${primaryColor}30` }}
                            />
                        ) : (
                            <div
                                className="flex h-36 w-36 items-center justify-center rounded-2xl text-4xl font-black shadow-xl"
                                style={{
                                    background: `linear-gradient(135deg, ${primaryColor}, ${secondary})`,
                                    color: getContrastTextColor(primaryColor),
                                    boxShadow: `0 12px 40px ${primaryColor}33`,
                                }}
                            >
                                {initials || <User className="w-16 h-16 opacity-80" />}
                            </div>
                        )}

                        {/* Credentials pills */}
                        {credentials.length > 0 && (
                            <ul className="flex flex-col gap-1.5 text-left">
                                {credentials.map((cred, i) => (
                                    <li
                                        key={i}
                                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                                    >
                                        <BadgeCheck
                                            className="w-3.5 h-3.5 shrink-0"
                                            style={{ color: primaryColor }}
                                        />
                                        {cred}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Text column */}
                    <div className="relative flex-1 text-center lg:text-left">
                        <p
                            className="mb-1 text-xs font-semibold uppercase tracking-widest"
                            style={{ color: accent }}
                        >
                            {content.role}
                        </p>
                        <h2 className="text-balance mb-5 text-3xl font-black tracking-tight text-foreground md:text-4xl">
                            {content.name}
                        </h2>
                        <p className="text-pretty text-base leading-relaxed text-muted-foreground mb-8">
                            {content.bio}
                        </p>

                        {(content.learnMoreUrl && content.learnMoreText) && (
                            <a
                                href={content.learnMoreUrl}
                                target={hasLearnMore ? '_blank' : undefined}
                                rel={hasLearnMore ? 'noopener noreferrer' : undefined}
                                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:opacity-90 hover:scale-[1.02]"
                                style={{
                                    backgroundColor: `${primaryColor}15`,
                                    color: primaryColor,
                                    border: `1px solid ${primaryColor}30`,
                                }}
                            >
                                {content.learnMoreText}
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        )}
                    </div>
                </div>
            </Container>
        </section>
    )
}

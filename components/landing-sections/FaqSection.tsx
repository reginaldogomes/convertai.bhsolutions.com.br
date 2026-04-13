'use client'

import { useState } from 'react'
import type { FaqContent } from '@/domain/entities'
import type { ColorPalette } from '@/domain/value-objects/design-system'
import { ChevronDown } from 'lucide-react'
import { Container } from '@/components/ui/container'

interface FaqSectionProps {
    content: FaqContent
    primaryColor: string
    palette?: ColorPalette
    isDark: boolean
}

export function FaqSection({ content, primaryColor, palette, isDark }: FaqSectionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <section id="faq" className="relative bg-background-secondary py-24 overflow-hidden">
            {/* Decorative glow */}
            <div
                className="pointer-events-none absolute -bottom-20 left-[20%] h-60 w-60 rounded-full blur-[120px] opacity-25"
                style={{ backgroundColor: primaryColor }}
                aria-hidden
            />

            <Container className="relative max-w-3xl">
                {content.title && (
                    <h2 className="text-balance mb-4 text-center text-3xl font-black tracking-tight text-foreground md:text-4xl">
                        {content.title}
                    </h2>
                )}
                {content.subtitle && (
                    <p className="mx-auto mb-12 max-w-xl text-center text-base leading-relaxed text-muted-foreground">
                        {content.subtitle}
                    </p>
                )}
                <div className="space-y-3" role="list">
                    {content.items.map((item, idx) => {
                        const isOpen = openIndex === idx
                        return (
                            <div
                                key={idx}
                                className={`surface-lift overflow-hidden rounded-2xl transition-all duration-300 ${
                                    isOpen
                                        ? isDark
                                            ? 'surface-glass border-white/12'
                                            : 'surface-glass border-black/8 shadow-sm'
                                        : isDark
                                            ? 'surface-glass border-white/6'
                                            : 'surface-glass border-black/4'
                                }`}
                                style={{
                                    borderLeftColor: isOpen ? primaryColor : undefined,
                                    borderLeftWidth: isOpen ? 3 : undefined,
                                }}
                                role="listitem"
                            >
                                <button
                                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                                    className="flex w-full items-center gap-4 px-6 py-5 text-left"
                                    aria-expanded={isOpen}
                                >
                                    {/* Number badge */}
                                    <span
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                                        style={{
                                            backgroundColor: isOpen ? `${primaryColor}18` : 'transparent',
                                            color: isOpen ? primaryColor : 'hsl(var(--muted-foreground))',
                                            border: isOpen ? 'none' : '1px solid hsl(var(--border) / 0.5)',
                                        }}
                                    >
                                        {String(idx + 1).padStart(2, '0')}
                                    </span>
                                    <span className="flex-1 pr-4 text-sm font-semibold text-foreground">{item.question}</span>
                                    <ChevronDown
                                        className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                                        style={{ color: isOpen ? primaryColor : 'hsl(var(--muted-foreground))' }}
                                        aria-hidden
                                    />
                                </button>
                                <div
                                    className={`grid transition-all duration-300 ease-in-out ${
                                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                    }`}
                                >
                                    <div className="overflow-hidden">
                                        <p className="px-6 pb-5 pl-17 text-sm leading-relaxed text-muted-foreground">
                                            {item.answer}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Container>
        </section>
    )
}

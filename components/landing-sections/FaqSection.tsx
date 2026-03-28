'use client'

import { useState } from 'react'
import type { FaqContent } from '@/domain/entities'
import { ChevronDown } from 'lucide-react'
import { Container } from '@/components/ui/container'

interface FaqSectionProps {
    content: FaqContent
    primaryColor: string
    isDark: boolean
}

export function FaqSection({ content, primaryColor }: FaqSectionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <section className="bg-background-secondary py-20">
            <Container className="max-w-3xl">
                {content.title && (
                    <h2 className="text-balance mb-3 text-center text-2xl font-black tracking-tight text-foreground md:text-3xl">
                        {content.title}
                    </h2>
                )}
                {content.subtitle && (
                    <p className="mx-auto mb-10 max-w-xl text-center text-base text-muted-foreground">
                        {content.subtitle}
                    </p>
                )}
                <div className="space-y-2.5" role="list">
                    {content.items.map((item, idx) => {
                        const isOpen = openIndex === idx
                        return (
                            <div
                                key={idx}
                                className={`overflow-hidden rounded-2xl border transition-colors duration-150 ${
                                    isOpen ? 'border-primary/30 bg-card' : 'border-border/70 bg-card hover:border-border'
                                }`}
                                role="listitem"
                            >
                                <button
                                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                                    className="flex w-full items-center justify-between px-6 py-4 text-left"
                                    aria-expanded={isOpen}
                                >
                                    <span className="pr-4 text-sm font-semibold text-foreground">{item.question}</span>
                                    <ChevronDown
                                        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                        style={{ color: primaryColor }}
                                        aria-hidden
                                    />
                                </button>
                                <div
                                    className={`grid transition-all duration-200 ease-in-out ${
                                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                    }`}
                                >
                                    <div className="overflow-hidden">
                                        <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
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

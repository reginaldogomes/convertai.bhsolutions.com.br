'use client'

import type { TestimonialsContent } from '@/domain/entities'
import type { ColorPalette } from '@/domain/value-objects/design-system'
import { Star, Quote } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { getContrastTextColor } from '@/lib/utils'

interface TestimonialsSectionProps {
    content: TestimonialsContent
    primaryColor: string
    palette?: ColorPalette
    isDark: boolean
}

export function TestimonialsSection({ content, primaryColor, palette, isDark }: TestimonialsSectionProps) {
    const secondary = palette?.secondary ?? primaryColor
    return (
        <section className="relative bg-background py-24 overflow-hidden">
            {/* Decorative glow */}
            <div
                className="pointer-events-none absolute bottom-0 right-[10%] h-80 w-80 rounded-full blur-[140px] opacity-25"
                style={{ backgroundColor: primaryColor }}
                aria-hidden
            />

            <Container>
                {content.title && (
                    <h2 className="text-balance mb-14 text-center text-3xl font-black tracking-tight text-foreground md:text-4xl">
                        {content.title}
                    </h2>
                )}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {content.items.map((item, idx) => (
                        <div
                            key={idx}
                            className={`group surface-lift relative flex flex-col rounded-2xl p-6 ${
                                isDark
                                    ? 'surface-glass border-white/10'
                                    : 'surface-glass border-black/6'
                            }`}
                        >
                            {/* Stars */}
                            <div className="mb-5 flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className="w-4 h-4"
                                        fill={i < item.rating ? primaryColor : 'none'}
                                        style={{
                                            color: i < item.rating ? primaryColor : 'hsl(var(--border))',
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Quote */}
                            <div className="relative flex-1 mb-6">
                                <Quote
                                    className="absolute -top-1 -left-1 w-8 h-8 opacity-[0.07]"
                                    style={{ color: primaryColor }}
                                    aria-hidden
                                />
                                <p className="pl-6 text-sm leading-relaxed text-muted-foreground italic">
                                    &ldquo;{item.quote}&rdquo;
                                </p>
                            </div>

                            {/* Author */}
                            <div className="flex items-center gap-3 pt-5 border-t border-border/40">
                                {item.avatarUrl ? (
                                    <img
                                        src={item.avatarUrl}
                                        alt={item.name}
                                        className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-border/30"
                                    />
                                ) : (
                                    <div
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-md"
                                        style={{
                                            background: `linear-gradient(135deg, ${primaryColor}, ${secondary})`,
                                            color: getContrastTextColor(primaryColor),
                                        }}
                                        aria-hidden
                                    >
                                        {item.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-bold text-foreground">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.role}{item.company ? ` · ${item.company}` : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    )
}

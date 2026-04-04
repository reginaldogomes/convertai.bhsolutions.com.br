'use client'

import type { TestimonialsContent } from '@/domain/entities'
import type { ColorPalette } from '@/domain/value-objects/design-system'
import { Star, Quote } from 'lucide-react'
import { Container } from '@/components/ui/container'

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
                className="pointer-events-none absolute bottom-0 right-[10%] h-80 w-80 rounded-full blur-[140px] opacity-10"
                style={{ backgroundColor: primaryColor }}
                aria-hidden
            />

            <Container>
                {content.title && (
                    <h2 className="text-balance mb-14 text-center text-2xl font-black tracking-tight text-foreground md:text-4xl">
                        {content.title}
                    </h2>
                )}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {content.items.map((item, idx) => (
                        <div
                            key={idx}
                            className={`group relative flex flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${
                                isDark
                                    ? 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1]'
                                    : 'bg-white/70 border border-black/[0.04] hover:bg-white hover:border-black/[0.08]'
                            }`}
                            style={{ backdropFilter: 'blur(12px)' }}
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
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
                                        style={{
                                            background: `linear-gradient(135deg, ${primaryColor}, ${secondary})`,
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

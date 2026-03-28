'use client'

import type { TestimonialsContent } from '@/domain/entities'
import { Star, Quote } from 'lucide-react'
import { Container } from '@/components/ui/container'

interface TestimonialsSectionProps {
    content: TestimonialsContent
    primaryColor: string
    isDark: boolean
}

export function TestimonialsSection({ content, primaryColor }: TestimonialsSectionProps) {
    return (
        <section className="bg-background py-20">
            <Container>
                {content.title && (
                    <h2 className="text-balance mb-12 text-center text-2xl font-black tracking-tight text-foreground md:text-3xl">
                        {content.title}
                    </h2>
                )}
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {content.items.map((item, idx) => (
                        <div
                            key={idx}
                            className="group flex flex-col rounded-2xl border border-border/70 bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
                        >
                            {/* Stars */}
                            <div className="mb-4 flex items-center gap-1">
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
                            <div className="relative flex-1 mb-5">
                                <Quote
                                    className="absolute -top-1 -left-1 w-6 h-6 opacity-10"
                                    style={{ color: primaryColor }}
                                    aria-hidden
                                />
                                <p className="pl-5 text-sm leading-relaxed text-muted-foreground italic">
                                    {item.quote}
                                </p>
                            </div>

                            {/* Author */}
                            <div className="flex items-center gap-3 border-t border-border/60 pt-4">
                                {item.avatarUrl ? (
                                    <img
                                        src={item.avatarUrl}
                                        alt={item.name}
                                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                                    />
                                ) : (
                                    <div
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                                        style={{ backgroundColor: primaryColor }}
                                        aria-hidden
                                    >
                                        {item.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-bold text-foreground">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.role}{item.company ? `, ${item.company}` : ''}
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

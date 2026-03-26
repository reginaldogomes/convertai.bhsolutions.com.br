'use client'

import type { TestimonialsContent } from '@/domain/entities'
import { Star } from 'lucide-react'

interface TestimonialsSectionProps {
    content: TestimonialsContent
    primaryColor: string
    isDark: boolean
}

export function TestimonialsSection({ content, primaryColor, isDark }: TestimonialsSectionProps) {
    return (
        <section className={`py-20 ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <div className="max-w-5xl mx-auto px-6">
                {content.title && (
                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">{content.title}</h2>
                )}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {content.items.map((item, idx) => (
                        <div
                            key={idx}
                            className={`p-6 rounded-xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}
                        >
                            <div className="flex items-center gap-1 mb-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className="w-4 h-4"
                                        fill={i < item.rating ? primaryColor : 'transparent'}
                                        style={{ color: i < item.rating ? primaryColor : isDark ? '#4b5563' : '#d1d5db' }}
                                    />
                                ))}
                            </div>
                            <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                &ldquo;{item.quote}&rdquo;
                            </p>
                            <div className="flex items-center gap-3">
                                {item.avatarUrl ? (
                                    <img src={item.avatarUrl} alt={item.name} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        {item.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-semibold">{item.name}</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {item.role}{item.company ? `, ${item.company}` : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

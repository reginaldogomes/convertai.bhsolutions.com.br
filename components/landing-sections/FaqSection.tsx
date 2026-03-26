'use client'

import { useState } from 'react'
import type { FaqContent } from '@/domain/entities'
import { ChevronDown } from 'lucide-react'

interface FaqSectionProps {
    content: FaqContent
    primaryColor: string
    isDark: boolean
}

export function FaqSection({ content, primaryColor, isDark }: FaqSectionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <section className={`py-20 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-3xl mx-auto px-6">
                {content.title && (
                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">{content.title}</h2>
                )}
                {content.subtitle && (
                    <p className={`text-center text-base mb-10 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {content.subtitle}
                    </p>
                )}
                <div className="space-y-3">
                    {content.items.map((item, idx) => {
                        const isOpen = openIndex === idx
                        return (
                            <div
                                key={idx}
                                className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
                            >
                                <button
                                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                                >
                                    <span className="font-medium text-sm">{item.question}</span>
                                    <ChevronDown
                                        className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                        style={{ color: primaryColor }}
                                    />
                                </button>
                                {isOpen && (
                                    <div className={`px-6 pb-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {item.answer}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

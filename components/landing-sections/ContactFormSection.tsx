'use client'

import { useState } from 'react'
import type { ContactFormContent } from '@/domain/entities'
import { Send, CheckCircle } from 'lucide-react'

interface ContactFormSectionProps {
    content: ContactFormContent
    primaryColor: string
    isDark: boolean
    landingPageId: string
}

const FIELD_LABELS: Record<string, string> = {
    name: 'Nome',
    email: 'E-mail',
    phone: 'Telefone',
    company: 'Empresa',
    message: 'Mensagem',
}

const FIELD_TYPES: Record<string, string> = {
    name: 'text',
    email: 'email',
    phone: 'tel',
    company: 'text',
    message: 'textarea',
}

export function ContactFormSection({ content, primaryColor, isDark, landingPageId }: ContactFormSectionProps) {
    const [submitted, setSubmitted] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitting(true)

        const formData = new FormData(e.currentTarget)
        const data: Record<string, string> = {}
        for (const field of content.fields) {
            data[field] = (formData.get(field) as string) || ''
        }

        try {
            await fetch('/api/landing-pages/lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ landingPageId, ...data }),
            })
            setSubmitted(true)
        } catch {
            // Silently handle — user sees no change
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <section className={`py-20 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-lg mx-auto px-6">
                {content.title && (
                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">{content.title}</h2>
                )}
                {content.subtitle && (
                    <p className={`text-center text-base mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {content.subtitle}
                    </p>
                )}

                {submitted ? (
                    <div className="text-center py-10">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: primaryColor }} />
                        <p className="text-lg font-semibold">{content.successMessage}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {content.fields.map((field) => (
                            <div key={field}>
                                <label
                                    htmlFor={`cf-${field}`}
                                    className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                                >
                                    {FIELD_LABELS[field] ?? field}
                                </label>
                                {FIELD_TYPES[field] === 'textarea' ? (
                                    <textarea
                                        id={`cf-${field}`}
                                        name={field}
                                        rows={4}
                                        required={field === 'email' || field === 'name'}
                                        className={`w-full rounded-lg px-4 py-2.5 text-sm border outline-none transition-colors focus:ring-2 ${
                                            isDark
                                                ? 'bg-gray-800 border-gray-700 text-white focus:border-transparent'
                                                : 'bg-white border-gray-300 text-gray-900 focus:border-transparent'
                                        }`}
                                        style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                                    />
                                ) : (
                                    <input
                                        id={`cf-${field}`}
                                        name={field}
                                        type={FIELD_TYPES[field] ?? 'text'}
                                        required={field === 'email' || field === 'name'}
                                        className={`w-full rounded-lg px-4 py-2.5 text-sm border outline-none transition-colors focus:ring-2 ${
                                            isDark
                                                ? 'bg-gray-800 border-gray-700 text-white focus:border-transparent'
                                                : 'bg-white border-gray-300 text-gray-900 focus:border-transparent'
                                        }`}
                                        style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                                    />
                                )}
                            </div>
                        ))}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Send className="w-4 h-4" />
                            {submitting ? 'Enviando...' : content.submitText}
                        </button>
                    </form>
                )}
            </div>
        </section>
    )
}

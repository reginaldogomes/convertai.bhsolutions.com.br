'use client'

import { useState } from 'react'
import { z } from 'zod'
import type { ContactFormContent } from '@/domain/entities'
import type { ColorPalette } from '@/domain/value-objects/design-system'
import { Send, CheckCircle, Clock, X } from 'lucide-react'

interface ContactFormSectionProps {
    content: ContactFormContent
    primaryColor: string
    palette?: ColorPalette
    isDark: boolean
    landingPageId: string
}

const FIELD_LABELS: Record<string, string> = {
    name: 'Nome',
    email: 'E-mail',
    phone: 'WhatsApp',
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

const FIELD_PLACEHOLDERS: Record<string, string> = {
    name: 'João Silva',
    email: 'seu@email.com',
    phone: '(11) 99999-9999',
    company: 'Nome da empresa',
    message: 'Como podemos ajudar?',
}

// Client-side Zod schemas per field
const fieldSchemas: Record<string, z.ZodTypeAny> = {
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    phone: z.string().refine(
        v => !v || v.replace(/\D/g, '').length >= 10,
        'WhatsApp inválido — informe DDD + número'
    ),
    company: z.string(),
    message: z.string(),
}

function maskPhone(value: string): string {
    const d = value.replace(/\D/g, '').slice(0, 11)
    if (d.length === 0) return ''
    if (d.length <= 2) return `(${d}`
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function ContactFormSection({ content, primaryColor, palette, isDark, landingPageId }: ContactFormSectionProps) {
    const [submitted, setSubmitted] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [consent, setConsent] = useState(false)
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    const handleFieldChange = (field: string, value: string) => {
        const masked = field === 'phone' ? maskPhone(value) : value
        setFieldValues(prev => ({ ...prev, [field]: masked }))
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const validateFields = (data: Record<string, string>): Record<string, string> => {
        const errors: Record<string, string> = {}
        for (const field of content.fields) {
            const schema = fieldSchemas[field]
            if (!schema) continue
            const result = schema.safeParse(data[field] ?? '')
            if (!result.success) {
                errors[field] = result.error.issues[0]?.message ?? 'Campo inválido'
            }
        }
        return errors
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)

        // Build data from controlled state + FormData fallback
        const formData = new FormData(e.currentTarget)
        const data: Record<string, string> = {}
        for (const field of content.fields) {
            data[field] = fieldValues[field] ?? (formData.get(field) as string) ?? ''
        }

        // Client-side Zod validation
        const errors = validateFields(data)
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch('/api/landing-pages/lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ landingPageId, consent: true, ...data }),
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                setError(body.error ?? 'Ocorreu um erro ao enviar. Tente novamente.')
            } else {
                setSubmitted(true)
                setDialogOpen(true)
            }
        } catch {
            setError('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')
        } finally {
            setSubmitting(false)
        }
    }

    const inputClass = (field: string) =>
        `w-full rounded-lg px-4 py-2.5 text-sm border outline-none transition-colors focus:ring-2 focus:ring-primary/20 ${
            fieldErrors[field]
                ? 'border-destructive/60 bg-destructive/5 text-foreground focus:border-destructive/60'
                : 'bg-background border-border text-foreground focus:border-primary/60'
        }`

    return (
        <>
            {/* Success Dialog */}
            {dialogOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cf-dialog-title"
                >
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setDialogOpen(false)}
                    />
                    <div className="surface-glass relative w-full max-w-sm rounded-2xl border p-8 text-center shadow-2xl">
                        <button
                            onClick={() => setDialogOpen(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Fechar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div
                            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${primaryColor}18` }}
                        >
                            <CheckCircle className="w-8 h-8" style={{ color: primaryColor }} />
                        </div>
                        <h3 id="cf-dialog-title" className="text-xl font-black text-foreground mb-2 tracking-tight">
                            Mensagem recebida!
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                            Obrigado pelo seu contato. Já registramos suas informações e em{' '}
                            <strong className="text-foreground">breve entraremos em contato</strong>.
                        </p>
                        <div
                            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold mb-6"
                            style={{ borderColor: `${primaryColor}40`, color: primaryColor, backgroundColor: `${primaryColor}0e` }}
                        >
                            <Clock className="w-3.5 h-3.5" />
                            Retorno em até 24 horas
                        </div>
                        <button
                            onClick={() => setDialogOpen(false)}
                            className="w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: primaryColor }}
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}

            {/* Section */}
            <section id="contato" className="bg-background-secondary py-20">
                <div className="max-w-lg mx-auto px-6">
                    {content.title && (
                        <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">{content.title}</h2>
                    )}
                    {content.subtitle && (
                        <p className="text-center text-base mb-8 text-muted-foreground">
                            {content.subtitle}
                        </p>
                    )}

                    {submitted ? (
                        <div className="text-center py-10">
                            <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: primaryColor }} />
                            <p className="text-lg font-semibold">{content.successMessage}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="surface-glass space-y-4 rounded-2xl border p-5 md:p-6" noValidate>
                            {error && (
                                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                                    {error}
                                </div>
                            )}

                            {content.fields.map((field) => (
                                <div key={field}>
                                    <label
                                        htmlFor={`cf-${field}`}
                                        className="block text-sm font-medium mb-1.5 text-foreground"
                                    >
                                        {FIELD_LABELS[field] ?? field}
                                        {(field === 'name' || field === 'email') && (
                                            <span className="text-red-400 ml-0.5">*</span>
                                        )}
                                    </label>

                                    {FIELD_TYPES[field] === 'textarea' ? (
                                        <textarea
                                            id={`cf-${field}`}
                                            name={field}
                                            rows={4}
                                            placeholder={FIELD_PLACEHOLDERS[field]}
                                            value={fieldValues[field] ?? ''}
                                            onChange={e => handleFieldChange(field, e.target.value)}
                                            className={inputClass(field)}
                                            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                                            aria-describedby={fieldErrors[field] ? `cf-err-${field}` : undefined}
                                        />
                                    ) : (
                                        <input
                                            id={`cf-${field}`}
                                            name={field}
                                            type={FIELD_TYPES[field] ?? 'text'}
                                            inputMode={field === 'phone' ? 'numeric' : undefined}
                                            placeholder={FIELD_PLACEHOLDERS[field]}
                                            value={fieldValues[field] ?? ''}
                                            onChange={e => handleFieldChange(field, e.target.value)}
                                            className={inputClass(field)}
                                            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                                            aria-describedby={fieldErrors[field] ? `cf-err-${field}` : undefined}
                                        />
                                    )}

                                    {fieldErrors[field] && (
                                        <p id={`cf-err-${field}`} className="mt-1 text-xs text-red-500" role="alert">
                                            {fieldErrors[field]}
                                        </p>
                                    )}
                                </div>
                            ))}

                            <div className="flex items-start gap-3 pt-1">
                                <input
                                    id="cf-consent"
                                    type="checkbox"
                                    required
                                    checked={consent}
                                    onChange={(e) => setConsent(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 accent-current"
                                    style={{ accentColor: primaryColor }}
                                />
                                <label
                                    htmlFor="cf-consent"
                                    className={`text-xs leading-snug cursor-pointer text-muted-foreground`}
                                >
                                    Ao enviar este formulário, você concorda com o uso dos seus dados para fins de
                                    contato comercial, conforme a{' '}
                                    <abbr title="Lei Geral de Proteção de Dados" className="no-underline cursor-help">LGPD</abbr>
                                    {' '}(Lei 13.709/2018).
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={!consent || submitting}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <Send className="w-4 h-4" />
                                {submitting ? 'Enviando...' : content.submitText}
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </>
    )
}

'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Loader2, X } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { InlineError } from '@/components/ui/inline-error'
import { formatErrorWithRequestId, parseApiError } from '@/lib/client-api-error'
import { WhatsAppMessagePreview } from './WhatsAppMessagePreview'

const OBJECTIVES = [
    { value: 'promocao', label: 'Promoção / Oferta' },
    { value: 'followup', label: 'Follow-up' },
    { value: 'reengajamento', label: 'Reengajamento' },
    { value: 'confirmacao', label: 'Confirmação' },
    { value: 'lembrete', label: 'Lembrete' },
    { value: 'boas_vindas', label: 'Boas-vindas' },
]

const TONES = [
    { value: 'formal', label: 'Formal' },
    { value: 'casual', label: 'Casual' },
    { value: 'urgente', label: 'Urgente' },
    { value: 'empático', label: 'Empático' },
]

interface GenerateWhatsAppAIProps {
    channel: 'whatsapp' | 'sms'
    campaignName: string
    onGenerated: (text: string) => void
}

export function GenerateWhatsAppAI({ channel, campaignName, onGenerated }: GenerateWhatsAppAIProps) {
    const [open, setOpen] = useState(false)
    const [objective, setObjective] = useState('')
    const [tone, setTone] = useState('casual')
    const [audience, setAudience] = useState('')
    const [details, setDetails] = useState('')
    const [completion, setCompletion] = useState('')
    const [generationError, setGenerationError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const abortRef = useRef<AbortController | null>(null)

    const isWhatsApp = channel === 'whatsapp'

    const handleGenerate = useCallback(async () => {
        if (!objective) return

        setIsLoading(true)
        setCompletion('')
        setGenerationError('')

        const controller = new AbortController()
        abortRef.current = controller

        try {
            const response = await fetch('/api/campaigns/generate-whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channel, objective, tone, audience, details, campaignName }),
                signal: controller.signal,
            })

            if (!response.ok || !response.body) {
                const apiError = await parseApiError(response, 'Erro ao gerar mensagem')
                throw new Error(formatErrorWithRequestId(apiError.message, apiError.requestId))
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let fullText = ''

            for (;;) {
                const { done, value } = await reader.read()
                if (done) break
                const chunk = decoder.decode(value, { stream: true })
                fullText += chunk
                setCompletion(fullText)
            }

            onGenerated(fullText)
            setOpen(false)
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return
            setGenerationError(err instanceof Error ? err.message : 'Erro ao gerar mensagem.')
        } finally {
            setIsLoading(false)
            abortRef.current = null
        }
    }, [channel, objective, tone, audience, details, campaignName, onGenerated])

    const stop = useCallback(() => {
        abortRef.current?.abort()
        setIsLoading(false)
    }, [])

    return (
        <>
            <Button
                type="button"
                onClick={() => setOpen(true)}
                variant="outline"
                className="h-9 font-bold uppercase tracking-wider text-xs flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5"
            >
                <Sparkles className="w-3.5 h-3.5" />
                Gerar com IA
            </Button>

            <Dialog open={open} onOpenChange={(v) => { if (!v && isLoading) stop(); setOpen(v) }}>
                <DialogContent className="bg-[hsl(var(--background-tertiary))] border-border rounded-(--radius) sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-foreground text-lg font-black tracking-tight flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Gerar mensagem {isWhatsApp ? 'WhatsApp' : 'SMS'} com IA
                        </DialogTitle>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="py-6 space-y-4">
                            <div className="flex items-center gap-3 text-primary">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <p className="text-sm font-bold">Gerando mensagem...</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-secondary border border-border rounded-(--radius) p-4 max-h-64 overflow-auto">
                                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2">Texto gerado</p>
                                    <pre className="text-foreground-secondary text-xs font-mono whitespace-pre-wrap break-words">
                                        {completion || 'Aguardando Gemini...'}
                                    </pre>
                                </div>
                                {isWhatsApp && completion && (
                                    <WhatsAppMessagePreview body={completion} standalone />
                                )}
                            </div>
                            <div className="flex justify-end">
                                <Button type="button" variant="ghost" onClick={() => { stop(); setOpen(false) }} className="h-9 gap-2">
                                    <X className="w-3.5 h-3.5" />
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Objetivo *</Label>
                                    <Select value={objective} onValueChange={setObjective}>
                                        <SelectTrigger className="bg-secondary border-border text-foreground rounded-(--radius) h-9 text-sm">
                                            <SelectValue placeholder="Selecione o objetivo" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border text-foreground rounded-(--radius)">
                                            {OBJECTIVES.map(o => (
                                                <SelectItem key={o.value} value={o.value} className="rounded-(--radius) focus:bg-primary focus:text-white cursor-pointer">
                                                    {o.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Tom de Voz</Label>
                                    <Select value={tone} onValueChange={setTone}>
                                        <SelectTrigger className="bg-secondary border-border text-foreground rounded-(--radius) h-9 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border text-foreground rounded-(--radius)">
                                            {TONES.map(t => (
                                                <SelectItem key={t.value} value={t.value} className="rounded-(--radius) focus:bg-primary focus:text-white cursor-pointer">
                                                    {t.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Detalhes da oferta / mensagem</Label>
                                <Textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    placeholder={isWhatsApp
                                        ? 'Ex: Desconto de 30% em todos os planos, válido até domingo. Cupom: BLACK30'
                                        : 'Ex: Promoção válida até 31/12. Txt PARE para parar de receber.'
                                    }
                                    rows={3}
                                    className="bg-secondary border-border text-foreground rounded-(--radius) text-sm resize-none"
                                />
                            </div>

                            <div className="bg-[hsl(var(--primary-subtle))] border border-primary/30 p-3 rounded-(--radius)">
                                <p className="text-primary text-xs font-bold uppercase tracking-wider mb-1">Como funciona</p>
                                <p className="text-foreground-secondary text-xs leading-relaxed">
                                    O Gemini gerará uma mensagem otimizada para {isWhatsApp ? 'WhatsApp' : 'SMS'} com formatação nativa
                                    {isWhatsApp ? ' (*negrito*, _itálico_, emojis)' : ' (texto simples, até 160 chars)'}.
                                    As variáveis <code className="text-primary font-mono text-[11px]">{'{{nome}}'}</code> e{' '}
                                    <code className="text-primary font-mono text-[11px]">{'{{telefone}}'}</code> serão incluídas.
                                </p>
                            </div>

                            {generationError && <InlineError message={generationError} />}

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-9">
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleGenerate}
                                    disabled={!objective}
                                    className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white rounded-(--radius) h-9 font-bold uppercase tracking-wider text-xs flex items-center gap-2 disabled:opacity-40"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Gerar Mensagem
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}

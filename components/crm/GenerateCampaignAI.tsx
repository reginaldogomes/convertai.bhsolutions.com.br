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

const OBJECTIVES = [
    { value: 'promocao', label: 'Promoção / Oferta' },
    { value: 'newsletter', label: 'Newsletter' },
    { value: 'followup', label: 'Follow-up' },
    { value: 'reengajamento', label: 'Reengajamento' },
    { value: 'convite', label: 'Convite / Evento' },
    { value: 'boas_vindas', label: 'Boas-vindas' },
]

const TONES = [
    { value: 'formal', label: 'Formal' },
    { value: 'casual', label: 'Casual' },
    { value: 'urgente', label: 'Urgente' },
    { value: 'informativo', label: 'Informativo' },
]

interface GenerateCampaignAIProps {
    campaignName: string
    campaignSubject: string
    onGenerated: (html: string) => void
}

export function GenerateCampaignAI({ campaignName, campaignSubject, onGenerated }: GenerateCampaignAIProps) {
    const [open, setOpen] = useState(false)
    const [objective, setObjective] = useState('')
    const [tone, setTone] = useState('')
    const [audience, setAudience] = useState('')
    const [details, setDetails] = useState('')
    const [completion, setCompletion] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const abortRef = useRef<AbortController | null>(null)

    const handleGenerate = useCallback(async () => {
        if (!objective || !tone) return

        setIsLoading(true)
        setCompletion('')

        const controller = new AbortController()
        abortRef.current = controller

        try {
            const response = await fetch('/api/campaigns/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    objective,
                    tone,
                    audience,
                    details,
                    campaignName,
                    campaignSubject,
                }),
                signal: controller.signal,
            })

            if (!response.ok || !response.body) {
                throw new Error('Erro ao gerar campanha')
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
            setCompletion('Erro ao gerar HTML. Tente novamente.')
        } finally {
            setIsLoading(false)
            abortRef.current = null
        }
    }, [objective, tone, audience, details, campaignName, campaignSubject, onGenerated])

    const stop = useCallback(() => {
        abortRef.current?.abort()
        setIsLoading(false)
    }, [])

    const handleClose = (isOpen: boolean) => {
        if (!isOpen && isLoading) stop()
        setOpen(isOpen)
    }

    return (
        <>
            <Button
                type="button"
                onClick={() => setOpen(true)}
                className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white border-0 rounded-(--radius) h-9 font-bold uppercase tracking-wider text-xs flex items-center gap-2 shadow-sm"
            >
                <Sparkles className="w-3.5 h-3.5" />
                Gerar com IA
            </Button>

            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="bg-[hsl(var(--background-tertiary))] border-border rounded-(--radius) sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-foreground text-lg font-black tracking-tight flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Gerar HTML com IA
                        </DialogTitle>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="py-6 space-y-4">
                            <div className="flex items-center gap-3 text-primary">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <p className="text-sm font-bold">Gerando HTML da campanha...</p>
                            </div>

                            <div className="bg-secondary border border-border rounded-(--radius) p-4 max-h-64 overflow-auto">
                                <pre className="text-foreground-secondary text-xs font-mono whitespace-pre-wrap break-words">
                                    {completion || 'Aguardando resposta do Gemini...'}
                                </pre>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => { stop(); setOpen(false) }}
                                    className="text-foreground-secondary rounded-(--radius) h-9 flex items-center gap-2"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-foreground-secondary text-xs uppercase tracking-wider">
                                        Objetivo *
                                    </Label>
                                    <Select value={objective} onValueChange={setObjective}>
                                        <SelectTrigger className="bg-secondary border-border text-foreground rounded-(--radius) h-9 text-sm">
                                            <SelectValue placeholder="Selecione" />
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
                                    <Label className="text-foreground-secondary text-xs uppercase tracking-wider">
                                        Tom de Voz *
                                    </Label>
                                    <Select value={tone} onValueChange={setTone}>
                                        <SelectTrigger className="bg-secondary border-border text-foreground rounded-(--radius) h-9 text-sm">
                                            <SelectValue placeholder="Selecione" />
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
                                <Label className="text-foreground-secondary text-xs uppercase tracking-wider">
                                    Público-Alvo
                                </Label>
                                <Select value={audience} onValueChange={setAudience}>
                                    <SelectTrigger className="bg-secondary border-border text-foreground rounded-(--radius) h-9 text-sm">
                                        <SelectValue placeholder="Todos os contatos" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground rounded-(--radius)">
                                        <SelectItem value="todos" className="rounded-(--radius) focus:bg-primary focus:text-white cursor-pointer">Todos os contatos</SelectItem>
                                        <SelectItem value="leads" className="rounded-(--radius) focus:bg-primary focus:text-white cursor-pointer">Novos leads</SelectItem>
                                        <SelectItem value="clientes" className="rounded-(--radius) focus:bg-primary focus:text-white cursor-pointer">Clientes ativos</SelectItem>
                                        <SelectItem value="inativos" className="rounded-(--radius) focus:bg-primary focus:text-white cursor-pointer">Contatos inativos</SelectItem>
                                        <SelectItem value="b2b" className="rounded-(--radius) focus:bg-primary focus:text-white cursor-pointer">Empresas (B2B)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-foreground-secondary text-xs uppercase tracking-wider">
                                    Detalhes Adicionais
                                </Label>
                                <Textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    placeholder="Ex: Promoção de 20% em todos os planos, válido até sexta-feira. Incluir depoimento de cliente..."
                                    rows={3}
                                    className="bg-secondary border-border text-foreground rounded-(--radius) text-sm resize-none placeholder:text-muted-foreground"
                                />
                            </div>

                            <div className="bg-[hsl(var(--primary-subtle))] border border-primary p-3 rounded-(--radius)">
                                <p className="text-primary text-xs font-bold uppercase tracking-wider mb-1">Contexto automático</p>
                                <p className="text-foreground-secondary text-xs leading-relaxed">
                                    A IA usará dados do seu CRM (contatos, tags, pipeline, campanhas anteriores) para gerar um email personalizado e relevante.
                                    Variáveis <code className="text-primary font-mono">{'{{nome}}'}</code> e <code className="text-primary font-mono">{'{{email}}'}</code> serão incluídas automaticamente.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setOpen(false)}
                                    className="text-foreground-secondary rounded-(--radius) h-9"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleGenerate}
                                    disabled={!objective || !tone}
                                    className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white rounded-(--radius) h-9 font-bold uppercase tracking-wider text-xs flex items-center gap-2 disabled:opacity-40"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Gerar HTML
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}

'use client'

import { useState } from 'react'
import type { LandingPageSection } from '@/domain/entities'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import type { DesignSystem } from '@/domain/value-objects/design-system'

interface GenerateSectionsAIProps {
    onGenerated: (sections: LandingPageSection[], designSystem?: DesignSystem) => void
    pageContext?: {
        name: string
        headline: string
        subheadline: string
    }
}

const EXAMPLES = [
    'Clínica odontológica premium em São Paulo, especializada em implantes e ortodontia, com 3 planos de tratamento a partir de R$800',
    'SaaS de gestão financeira para pequenas empresas — plano Starter R$49/mês, Pro R$149/mês, Enterprise R$399/mês',
    'Escritório de advocacia trabalhista em BH, atendimento personalizado, 15 anos de experiência, honorários sem custo inicial',
    'Curso online de marketing digital para empreendedores, 8 semanas, certificado, R$997 ou 12x R$97',
    'Imobiliária especializada em alto padrão no Leblon, RJ — apartamentos de R$2M a R$8M',
]

export function GenerateSectionsAI({ onGenerated, pageContext }: GenerateSectionsAIProps) {
    const [open, setOpen] = useState(false)
    const [prompt, setPrompt] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [generated, setGenerated] = useState(false)

    const handleGenerate = async () => {
        if (!prompt.trim() || loading) return

        setLoading(true)
        setError('')
        setGenerated(false)

        try {
            const res = await fetch('/api/landing-pages/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    pageContext: pageContext ?? undefined,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Erro ao gerar. Tente novamente.')
                return
            }

            if (!data.sections || !Array.isArray(data.sections) || data.sections.length === 0) {
                setError('A IA não retornou seções válidas. Tente descrever com mais detalhes.')
                return
            }

            console.log('[GenerateSectionsAI] Received', data.sections.length, 'sections:', data.sections.map((s: { type: string }) => s.type))

            onGenerated(data.sections as LandingPageSection[], data.designSystem as DesignSystem | undefined)
            setGenerated(true)
            setTimeout(() => setOpen(false), 1500)
            setPrompt('')
        } catch {
            setError('Erro de conexão. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar com IA
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-card">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-card-foreground">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Gerar Landing Page com IA
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-card-foreground">
                            Descreva o negócio / produto / serviço
                        </Label>
                        <Textarea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder="Ex: Clínica odontológica premium em SP, especializada em implantes, 3 planos a partir de R$800, público 35-60 anos..."
                            rows={4}
                            className="bg-background border-input"
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Quanto mais detalhes você incluir — nicho, público-alvo, diferenciais, preços e localização — mais preciso e persuasivo será o resultado.
                        </p>
                    </div>

                    {/* Example prompts */}
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Exemplos (clique para usar)</Label>
                        <div className="grid grid-cols-1 gap-1.5">
                            {EXAMPLES.map((ex, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPrompt(ex)}
                                    className="text-left text-xs px-3 py-2 rounded-md bg-[hsl(var(--secondary-subtle))] hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground truncate"
                                    disabled={loading}
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            {error}
                        </div>
                    )}

                    {generated && (
                        <div className="flex items-start gap-2 text-sm text-[hsl(var(--success))] bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20 rounded-md px-3 py-2">
                            <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                            Seções, conteúdo e tema visual foram gerados e salvos. Clique em &quot;Pré-visualizar&quot; para ver o resultado.
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            onClick={handleGenerate}
                            disabled={loading || prompt.trim().length < 10}
                            className="flex-1"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Gerando seções...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Gerar Seções
                                </>
                            )}
                        </Button>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancelar
                        </Button>
                    </div>

                    {loading && (
                        <p className="text-xs text-center text-muted-foreground">
                            A IA está criando as seções personalizadas. Isso pode levar alguns segundos...
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

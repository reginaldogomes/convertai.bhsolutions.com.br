'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Palette, Loader2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { formatErrorWithRequestId, parseApiError } from '@/lib/client-api-error'
import { InlineError } from '@/components/ui/inline-error'

const VISUAL_STYLES = [
    { value: 'moderno', label: 'Moderno & Minimalista' },
    { value: 'vibrante', label: 'Vibrante & Colorido' },
    { value: 'elegante', label: 'Elegante & Luxuoso' },
    { value: 'flat', label: 'Flat Design' },
    { value: 'foto-realista', label: 'Foto-realista' },
    { value: 'ilustracao', label: 'Ilustração' },
    { value: 'retro', label: 'Retrô / Vintage' },
    { value: 'neon', label: 'Neon / Cyberpunk' },
]

export function GenerateImagePromptButton() {
    const [open, setOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const [topic, setTopic] = useState('')
    const [contentType, setContentType] = useState('post')
    const [style, setStyle] = useState('moderno')
    const [targetAudience, setTargetAudience] = useState('')
    const [completion, setCompletion] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [generationError, setGenerationError] = useState('')

    const handleGenerate = async () => {
        if (!topic.trim()) {
            toast.error('Digite o tema do visual')
            return
        }

        setIsLoading(true)
        setGenerationError('')
        setCompletion('')

        try {
            const response = await fetch('/api/instagram/generate-image-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, contentType, style, targetAudience }),
            })

            if (!response.ok || !response.body) {
                const apiError = await parseApiError(response, 'Erro ao gerar prompt visual')
                setGenerationError(formatErrorWithRequestId(apiError.message, apiError.requestId))
                return
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let fullText = ''

            for (;;) {
                const { done, value } = await reader.read()
                if (done) break
                fullText += decoder.decode(value, { stream: true })
                setCompletion(fullText)
            }
        } catch {
            setGenerationError('Erro de conexão. Tente novamente.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCopy = async () => {
        await navigator.clipboard.writeText(completion)
        setCopied(true)
        toast.success('Prompt copiado!')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5">
                    <Palette className="w-4 h-4" />
                    Gerar Criativo
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-primary" />
                        Gerador de Criativos IA
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4">
                    {/* Left: Config */}
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Tema do Visual *</Label>
                            <Input
                                placeholder="Ex: Produto sendo usado por pessoa feliz"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Formato</Label>
                            <Select value={contentType} onValueChange={setContentType}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="post">Post (1:1)</SelectItem>
                                    <SelectItem value="story">Story (9:16)</SelectItem>
                                    <SelectItem value="reel">Reel (9:16)</SelectItem>
                                    <SelectItem value="carousel">Carrossel (1:1)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Estilo Visual</Label>
                            <Select value={style} onValueChange={setStyle}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {VISUAL_STYLES.map(s => (
                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Público-alvo</Label>
                            <Input
                                placeholder="Ex: Jovens 18-35 anos"
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full gap-1.5"
                            size="sm"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Gerando...
                                </>
                            ) : (
                                <>
                                    <Palette className="w-4 h-4" />
                                    Gerar Prompt Visual
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Right: Result */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs">Prompt para Geração de Imagem</Label>
                            {completion && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 gap-1 text-[10px]"
                                    onClick={handleCopy}
                                >
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    {copied ? 'Copiado!' : 'Copiar'}
                                </Button>
                            )}
                        </div>
                        <div className="h-88 rounded-lg border border-border bg-muted/50 p-3 overflow-y-auto">
                            {completion ? (
                                <div className="text-xs whitespace-pre-wrap leading-relaxed">{completion}</div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Gerando prompt de imagem...
                                        </div>
                                    ) : (
                                        'O prompt para geração de imagem aparecerá aqui'
                                    )}
                                </div>
                            )}
                        </div>
                        {generationError && <InlineError message={generationError} size="sm" />}
                        <p className="text-[10px] text-muted-foreground">
                            Use este prompt em ferramentas como DALL-E, Midjourney ou Gemini para gerar a imagem.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

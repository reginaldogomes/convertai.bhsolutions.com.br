'use client'

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { IMAGE_MODELS, type ImageModelId } from '@/lib/ai'
import {
    Wand2,
    Download,
    Loader2,
    Sparkles,
    Image as ImageIcon,
    ChevronDown,
    ChevronUp,
    RotateCcw,
    Zap,
    Crown,
    Star,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatErrorWithRequestId, parseApiError } from '@/lib/client-api-error'
import { InlineError } from '@/components/ui/inline-error'

const ASPECT_RATIOS = [
    { value: '1:1', label: '1:1', desc: 'Quadrado', icon: '⬜' },
    { value: '4:5', label: '4:5', desc: 'Feed', icon: '📱' },
    { value: '9:16', label: '9:16', desc: 'Story', icon: '📲' },
    { value: '16:9', label: '16:9', desc: 'Paisagem', icon: '🖥️' },
    { value: '3:4', label: '3:4', desc: 'Retrato', icon: '🪪' },
    { value: '4:3', label: '4:3', desc: 'Clássico', icon: '📺' },
]

const RESOLUTIONS = [
    { value: '1K', label: '1K', desc: 'Padrão' },
    { value: '2K', label: '2K', desc: 'Alta qualidade' },
    { value: '4K', label: '4K', desc: 'Ultra HD' },
]

const PROMPT_TEMPLATES = [
    { label: 'Produto', prompt: 'Fotografia profissional de produto em estúdio com iluminação softbox, fundo branco limpo, ângulo 45°, ultra-realista, detalhes nítidos.' },
    { label: 'Lifestyle', prompt: 'Cena lifestyle autêntica com pessoa usando o produto em ambiente natural, iluminação dourada, composição editorial, estilo de revista.' },
    { label: 'Tipografia', prompt: 'Design gráfico moderno e minimalista com texto grande e legível, paleta de cores vibrante, estilo flat design, ideal para post de Instagram.' },
    { label: 'Story', prompt: 'Template vertical de Story com design moderno, gradientes suaves, espaço para texto, elementos gráficos minimalistas, formato 9:16.' },
    { label: 'Carrossel', prompt: 'Capa de carrossel educativo com título grande e legível, design limpo e profissional, ícones minimalistas, identidade visual consistente.' },
    { label: 'Infográfico', prompt: 'Infográfico moderno e colorido com dados visuais, ícones, gráficos estilizados, fundo claro, texto legível em português.' },
]

const MODEL_ICONS: Record<string, typeof Star> = {
    'gemini-2.5-flash-image': Zap,
    'gemini-3.1-flash-image-preview': Star,
    'gemini-3-pro-image-preview': Crown,
}

interface GeneratedImage {
    data: string
    mimeType: string
}

export function CreativeGenerator() {
    const [open, setOpen] = useState(false)
    const [model, setModel] = useState<ImageModelId>('gemini-3.1-flash-image-preview')
    const [prompt, setPrompt] = useState('')
    const [aspectRatio, setAspectRatio] = useState('1:1')
    const [imageSize, setImageSize] = useState('1K')
    const [loading, setLoading] = useState(false)
    const [images, setImages] = useState<GeneratedImage[]>([])
    const [error, setError] = useState('')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [history, setHistory] = useState<Array<{ prompt: string; images: GeneratedImage[]; model: string }>>([])

    const selectedModel = IMAGE_MODELS.find(m => m.id === model)!

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            toast.error('Digite um prompt para gerar a imagem')
            return
        }

        setLoading(true)
        setError('')
        setImages([])

        try {
            const res = await fetch('/api/instagram/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    prompt: prompt.trim(),
                    aspectRatio,
                    ...(selectedModel.supportsSize ? { imageSize } : {}),
                }),
            })

            if (!res.ok) {
                const apiError = await parseApiError(res, 'Erro ao gerar imagem')
                setError(formatErrorWithRequestId(apiError.message, apiError.requestId))
                return
            }

            const data = await res.json()

            setImages(data.images)
            setHistory(prev => [{ prompt: prompt.trim(), images: data.images, model }, ...prev].slice(0, 10))
            toast.success(`Imagem gerada com ${selectedModel.name}`)
        } catch {
            setError('Erro de rede. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }, [prompt, model, aspectRatio, imageSize, selectedModel])

    const handleDownload = useCallback((img: GeneratedImage, index: number) => {
        const ext = img.mimeType.split('/')[1] || 'png'
        const link = document.createElement('a')
        link.href = `data:${img.mimeType};base64,${img.data}`
        link.download = `criativo-${Date.now()}-${index}.${ext}`
        link.click()
    }, [])

    const handleUseTemplate = useCallback((templatePrompt: string) => {
        setPrompt(prev => prev ? `${prev}\n${templatePrompt}` : templatePrompt)
    }, [])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" size="sm" className="h-8 px-3 text-xs font-bold uppercase tracking-wider">
                    <Wand2 className="w-3.5 h-3.5" />
                    Criar Imagem
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-foreground font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Gerador de Criativos com IA
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-5">
                    {/* Model Selector */}
                    <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Modelo</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {IMAGE_MODELS.map(m => {
                                const Icon = MODEL_ICONS[m.id] ?? Star
                                const isActive = model === m.id
                                return (
                                    <Button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setModel(m.id)}
                                        variant={isActive ? 'secondary' : 'outline'}
                                        className="relative h-auto w-full flex-col items-start gap-0 p-3 text-left"
                                    >
                                        <span className={`absolute top-2 right-2 px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded-(--radius) ${
                                            m.badge === 'Pro'
                                                ? 'bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]'
                                                : m.badge === 'Novo'
                                                    ? 'bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))]'
                                                    : 'bg-secondary text-muted-foreground'
                                        }`}>
                                            {m.badge}
                                        </span>
                                        <Icon className={`w-4 h-4 mb-1.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <p className="text-xs font-bold text-foreground">{m.name}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{m.description}</p>
                                    </Button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Prompt */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Prompt</Label>
                            <span className="text-[10px] text-muted-foreground font-mono-data">{prompt.length}/4000</span>
                        </div>
                        <textarea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            maxLength={4000}
                            rows={4}
                            placeholder="Descreva a imagem que deseja criar. Seja específico: estilo visual, iluminação, ângulo, cores, composição..."
                            className="w-full px-3 py-2.5 border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary transition-colors rounded-(--radius)"
                        />

                        {/* Quick Templates */}
                        <div className="flex flex-wrap gap-1.5">
                            {PROMPT_TEMPLATES.map(t => (
                                <Button
                                    key={t.label}
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    onClick={() => handleUseTemplate(t.prompt)}
                                    className="h-6 px-2 text-[10px] uppercase tracking-wider"
                                >
                                    {t.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Aspect Ratio */}
                    <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Proporção</Label>
                        <div className="grid grid-cols-6 gap-2">
                            {ASPECT_RATIOS.map(ar => (
                                <Button
                                    key={ar.value}
                                    type="button"
                                    variant={aspectRatio === ar.value ? 'secondary' : 'outline'}
                                    onClick={() => setAspectRatio(ar.value)}
                                    className="h-auto flex-col gap-0 p-2 text-center"
                                >
                                    <p className="text-lg leading-none">{ar.icon}</p>
                                    <p className="text-[10px] font-bold text-foreground mt-1">{ar.label}</p>
                                    <p className="text-[9px] text-muted-foreground">{ar.desc}</p>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Advanced Settings */}
                    {selectedModel.supportsSize && (
                        <div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
                            >
                                {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                <span className="uppercase tracking-wider font-bold">Configurações avançadas</span>
                            </Button>

                            {showAdvanced && (
                                <div className="mt-3 space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Resolução</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {RESOLUTIONS.map(r => (
                                            <Button
                                                key={r.value}
                                                type="button"
                                                variant={imageSize === r.value ? 'secondary' : 'outline'}
                                                onClick={() => setImageSize(r.value)}
                                                className="h-auto flex-col gap-0 p-2.5 text-center"
                                            >
                                                <p className="text-xs font-bold font-mono-data text-foreground">{r.label}</p>
                                                <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Generate Button */}
                    <Button
                        type="button"
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        className="h-11 w-full text-xs font-bold uppercase tracking-wider"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Gerando com {selectedModel.name}...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Gerar Criativo
                            </>
                        )}
                    </Button>

                    {/* Error */}
                    {error && <InlineError message={error} size="sm" />}

                    {/* Generated Images */}
                    {images.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Resultado</p>
                                <Button
                                    type="button"
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    variant="outline"
                                    size="xs"
                                    className="h-7 px-2.5 text-xs font-bold uppercase tracking-wider"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    Regenerar
                                </Button>
                            </div>
                            <div className="grid gap-3">
                                {images.map((img, i) => (
                                    <div key={i} className="border border-border bg-muted/30 overflow-hidden rounded-(--radius)">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={`data:${img.mimeType};base64,${img.data}`}
                                            alt={`Criativo gerado ${i + 1}`}
                                            className="w-full h-auto"
                                        />
                                        <div className="p-3 flex items-center justify-between border-t border-border">
                                            <span className="text-[10px] text-muted-foreground font-mono-data">
                                                {selectedModel.name} · {aspectRatio} · {img.mimeType.split('/')[1]?.toUpperCase()}
                                            </span>
                                            <Button
                                                type="button"
                                                onClick={() => handleDownload(img, i)}
                                                size="xs"
                                                className="h-7 px-2.5 text-[10px] font-bold uppercase tracking-wider"
                                            >
                                                <Download className="w-3 h-3" />
                                                Download
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* History */}
                    {history.length > 1 && !loading && (
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Histórico recente</p>
                            <div className="grid grid-cols-4 gap-2">
                                {history.slice(1, 5).map((h, i) => (
                                    <Button
                                        key={i}
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setImages(h.images)
                                        }}
                                        className="h-auto w-full overflow-hidden p-0"
                                    >
                                        {h.images[0] && (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={`data:${h.images[0].mimeType};base64,${h.images[0].data}`}
                                                alt={`Histórico ${i + 1}`}
                                                className="w-full h-20 object-cover"
                                            />
                                        )}
                                        <p className="p-1.5 text-[9px] text-muted-foreground truncate">{h.prompt.slice(0, 40)}...</p>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {images.length === 0 && !loading && !error && (
                        <div className="border border-dashed border-border bg-muted p-8 text-center space-y-2 rounded-(--radius)">
                            <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto" />
                            <p className="text-xs text-muted-foreground">
                                Selecione um modelo, escreva seu prompt e clique em <strong>Gerar Criativo</strong> para criar imagens com IA.
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

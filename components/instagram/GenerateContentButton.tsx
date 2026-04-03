'use client'

import { useState } from 'react'
import { useCompletion } from '@ai-sdk/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Copy, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const CONTENT_TYPES = [
    { value: 'post', label: 'Post' },
    { value: 'story', label: 'Story' },
    { value: 'reel', label: 'Reel' },
    { value: 'carousel', label: 'Carrossel' },
]

const OBJECTIVES = [
    { value: 'engajamento', label: 'Engajamento' },
    { value: 'trafego', label: 'Tráfego' },
    { value: 'vendas', label: 'Vendas' },
    { value: 'autoridade', label: 'Autoridade' },
    { value: 'educacional', label: 'Educacional' },
    { value: 'entretenimento', label: 'Entretenimento' },
]

const TONES = [
    { value: 'profissional', label: 'Profissional' },
    { value: 'casual', label: 'Casual' },
    { value: 'inspirador', label: 'Inspirador' },
    { value: 'humoristico', label: 'Humorístico' },
    { value: 'urgente', label: 'Urgente' },
]

export function GenerateContentButton() {
    const [open, setOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const [contentType, setContentType] = useState('post')
    const [objective, setObjective] = useState('engajamento')
    const [tone, setTone] = useState('profissional')
    const [topic, setTopic] = useState('')
    const [details, setDetails] = useState('')
    const [targetAudience, setTargetAudience] = useState('')
    const [includeHashtags, setIncludeHashtags] = useState(true)
    const [includeEmojis, setIncludeEmojis] = useState(true)

    const { completion, isLoading, complete } = useCompletion({
        api: '/api/instagram/generate-caption',
    })

    const handleGenerate = async () => {
        if (!topic.trim()) {
            toast.error('Digite o tema do conteúdo')
            return
        }
        await complete('', {
            body: {
                contentType,
                objective,
                tone,
                topic,
                details,
                targetAudience,
                includeHashtags,
                includeEmojis,
            },
        })
    }

    const handleCopy = async () => {
        await navigator.clipboard.writeText(completion)
        setCopied(true)
        toast.success('Legenda copiada!')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Gerar com IA
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Gerar Conteúdo com IA
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4">
                    {/* Left: Form */}
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Tipo</Label>
                            <Select value={contentType} onValueChange={setContentType}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CONTENT_TYPES.map(t => (
                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Objetivo</Label>
                            <Select value={objective} onValueChange={setObjective}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {OBJECTIVES.map(o => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Tom</Label>
                            <Select value={tone} onValueChange={setTone}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TONES.map(t => (
                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Tema / Assunto *</Label>
                            <Input
                                placeholder="Ex: Lançamento do novo produto X"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Público-alvo</Label>
                            <Input
                                placeholder="Ex: Empreendedores digitais"
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Detalhes adicionais</Label>
                            <Textarea
                                placeholder="Informações extras para o conteúdo..."
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                rows={2}
                                className="text-xs"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeHashtags}
                                    onChange={(e) => setIncludeHashtags(e.target.checked)}
                                    className="rounded"
                                />
                                Hashtags
                            </label>
                            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeEmojis}
                                    onChange={(e) => setIncludeEmojis(e.target.checked)}
                                    className="rounded"
                                />
                                Emojis
                            </label>
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
                                    <Sparkles className="w-4 h-4" />
                                    Gerar Legenda
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Right: Preview */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs">Resultado</Label>
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
                        <div className="h-95 rounded-lg border border-border bg-muted/50 p-3 overflow-y-auto">
                            {completion ? (
                                <div className="text-xs whitespace-pre-wrap leading-relaxed">{completion}</div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Gerando conteúdo com IA...
                                        </div>
                                    ) : (
                                        'O conteúdo gerado aparecerá aqui'
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

'use client'

import { useState } from 'react'
import { useCompletion } from '@ai-sdk/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarDays, Loader2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

export function CalendarButton() {
    const [open, setOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const [niche, setNiche] = useState('')
    const [days, setDays] = useState('7')
    const [postChecked, setPostChecked] = useState(true)
    const [reelChecked, setReelChecked] = useState(true)
    const [storyChecked, setStoryChecked] = useState(true)
    const [carouselChecked, setCarouselChecked] = useState(true)
    const [engajamentoChecked, setEngajamentoChecked] = useState(true)
    const [trafegoChecked, setTrafegoChecked] = useState(false)
    const [vendasChecked, setVendasChecked] = useState(false)
    const [autoridadeChecked, setAutoridadeChecked] = useState(true)

    const { completion, isLoading, complete } = useCompletion({
        api: '/api/instagram/generate-calendar',
    })

    const handleGenerate = async () => {
        if (!niche.trim()) {
            toast.error('Digite o nicho/segmento')
            return
        }

        const contentTypes = [
            postChecked && 'post',
            reelChecked && 'reel',
            storyChecked && 'story',
            carouselChecked && 'carrossel',
        ].filter(Boolean) as string[]

        const objectives = [
            engajamentoChecked && 'engajamento',
            trafegoChecked && 'tráfego',
            vendasChecked && 'vendas',
            autoridadeChecked && 'autoridade',
        ].filter(Boolean) as string[]

        await complete('', {
            body: {
                niche,
                days: Number(days),
                contentTypes,
                objectives,
            },
        })
    }

    const handleCopy = async () => {
        await navigator.clipboard.writeText(completion)
        setCopied(true)
        toast.success('Calendário copiado!')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5">
                    <CalendarDays className="w-4 h-4" />
                    Calendário IA
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-primary" />
                        Calendário Editorial com IA
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-[280px_1fr] gap-4">
                    {/* Left: Config */}
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Nicho / Segmento *</Label>
                            <Input
                                placeholder="Ex: Moda feminina, SaaS B2B..."
                                value={niche}
                                onChange={(e) => setNiche(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Período</Label>
                            <Select value={days} onValueChange={setDays}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">7 dias</SelectItem>
                                    <SelectItem value="14">14 dias</SelectItem>
                                    <SelectItem value="30">30 dias</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Tipos de Conteúdo</Label>
                            <div className="space-y-1">
                                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                    <input type="checkbox" checked={postChecked} onChange={(e) => setPostChecked(e.target.checked)} className="rounded" />
                                    Posts
                                </label>
                                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                    <input type="checkbox" checked={reelChecked} onChange={(e) => setReelChecked(e.target.checked)} className="rounded" />
                                    Reels
                                </label>
                                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                    <input type="checkbox" checked={storyChecked} onChange={(e) => setStoryChecked(e.target.checked)} className="rounded" />
                                    Stories
                                </label>
                                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                    <input type="checkbox" checked={carouselChecked} onChange={(e) => setCarouselChecked(e.target.checked)} className="rounded" />
                                    Carrosséis
                                </label>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Objetivos</Label>
                            <div className="space-y-1">
                                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                    <input type="checkbox" checked={engajamentoChecked} onChange={(e) => setEngajamentoChecked(e.target.checked)} className="rounded" />
                                    Engajamento
                                </label>
                                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                    <input type="checkbox" checked={trafegoChecked} onChange={(e) => setTrafegoChecked(e.target.checked)} className="rounded" />
                                    Tráfego
                                </label>
                                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                    <input type="checkbox" checked={vendasChecked} onChange={(e) => setVendasChecked(e.target.checked)} className="rounded" />
                                    Vendas
                                </label>
                                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                    <input type="checkbox" checked={autoridadeChecked} onChange={(e) => setAutoridadeChecked(e.target.checked)} className="rounded" />
                                    Autoridade
                                </label>
                            </div>
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
                                    <CalendarDays className="w-4 h-4" />
                                    Gerar Calendário
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Right: Calendar Result */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs">Calendário Editorial</Label>
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
                        <div className="h-112 rounded-lg border border-border bg-muted/50 p-3 overflow-y-auto">
                            {completion ? (
                                <div className="text-xs whitespace-pre-wrap leading-relaxed prose prose-xs max-w-none">
                                    {completion}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Gerando calendário editorial...
                                        </div>
                                    ) : (
                                        'O calendário gerado aparecerá aqui'
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

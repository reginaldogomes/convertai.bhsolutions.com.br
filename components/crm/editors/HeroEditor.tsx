'use client'

import type { HeroContent } from '@/domain/entities'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface HeroEditorProps {
    content: HeroContent
    onChange: (content: HeroContent) => void
}

export function HeroEditor({ content, onChange }: HeroEditorProps) {
    const update = (field: keyof HeroContent, value: string) => {
        onChange({ ...content, [field]: value })
    }

    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <Label className="text-xs">Kicker</Label>
                <Input value={content.kicker ?? ''} onChange={e => update('kicker', e.target.value)} className="bg-background" placeholder="Oferta exclusiva para novos clientes" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Título</Label>
                <Input value={content.headline} onChange={e => update('headline', e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Subtítulo</Label>
                <Textarea value={content.subheadline} onChange={e => update('subheadline', e.target.value)} rows={2} className="bg-background" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-xs">Texto do CTA</Label>
                    <Input value={content.ctaText} onChange={e => update('ctaText', e.target.value)} className="bg-background" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">URL do CTA</Label>
                    <Input value={content.ctaUrl} onChange={e => update('ctaUrl', e.target.value)} placeholder="#" className="bg-background" />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Imagem de Fundo (URL)</Label>
                <Input value={content.backgroundImageUrl ?? ''} onChange={e => update('backgroundImageUrl', e.target.value || '')} placeholder="https://..." className="bg-background" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Imagem de Destaque (URL)</Label>
                <Input value={content.heroImageUrl ?? ''} onChange={e => update('heroImageUrl', e.target.value || '')} placeholder="https://..." className="bg-background" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Layout do Hero</Label>
                <select
                    value={content.layout ?? 'split'}
                    onChange={e => update('layout', e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                    <option value="split">Texto + imagem ao lado</option>
                    <option value="background">Texto sobre imagem de fundo</option>
                </select>
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Selos de confiança (1 por linha)</Label>
                <Textarea
                    value={(content.trustBadges ?? []).join('\n')}
                    onChange={e => onChange({
                        ...content,
                        trustBadges: e.target.value
                            .split('\n')
                            .map((line) => line.trim())
                            .filter(Boolean)
                            .slice(0, 6),
                    })}
                    rows={3}
                    className="bg-background"
                    placeholder={'Sem compromisso\nSuporte especializado\nResultados mensuráveis'}
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Alinhamento</Label>
                <select
                    value={content.alignment}
                    onChange={e => update('alignment', e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                    <option value="center">Centralizado</option>
                    <option value="left">Esquerda</option>
                </select>
            </div>
        </div>
    )
}

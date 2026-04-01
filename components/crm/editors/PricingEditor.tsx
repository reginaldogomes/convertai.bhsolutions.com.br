'use client'

import type { PricingContent, PricingTier } from '@/domain/entities'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

interface PricingEditorProps {
    content: PricingContent
    onChange: (content: PricingContent) => void
}

export function PricingEditor({ content, onChange }: PricingEditorProps) {
    const updateTier = (idx: number, field: keyof PricingTier, value: unknown) => {
        const tiers = [...content.tiers]
        tiers[idx] = { ...tiers[idx], [field]: value }
        onChange({ ...content, tiers })
    }

    const addTier = () => {
        onChange({
            ...content,
            tiers: [...content.tiers, { name: '', price: 'R$ 0', period: '/mês', description: '', features: [], ctaText: 'Começar', highlighted: false }],
        })
    }

    const removeTier = (idx: number) => {
        onChange({ ...content, tiers: content.tiers.filter((_, i) => i !== idx) })
    }

    const updateFeatures = (tierIdx: number, featuresStr: string) => {
        const features = featuresStr.split('\n').filter(f => f.trim())
        updateTier(tierIdx, 'features', features)
    }

    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <Label className="text-xs">Título</Label>
                <Input value={content.title} onChange={e => onChange({ ...content, title: e.target.value })} className="bg-background" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Subtítulo</Label>
                <Input value={content.subtitle} onChange={e => onChange({ ...content, subtitle: e.target.value })} className="bg-background" />
            </div>

            <div className="space-y-2 mt-3">
                <Label className="text-xs font-semibold">Planos ({content.tiers.length})</Label>
                {content.tiers.map((tier, idx) => (
                    <div key={idx} className="p-3 border border-border rounded-md bg-[hsl(var(--secondary-subtle))] space-y-2">
                        <div className="flex items-center gap-2">
                            <Input value={tier.name} onChange={e => updateTier(idx, 'name', e.target.value)} placeholder="Nome do Plano" className="bg-background h-8 text-xs" />
                            <button onClick={() => removeTier(idx)} className="p-1 text-destructive hover:bg-[hsl(var(--destructive-subtle))] rounded shrink-0">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <Input value={tier.price} onChange={e => updateTier(idx, 'price', e.target.value)} placeholder="R$ 99" className="bg-background h-8 text-xs" />
                            <Input value={tier.period} onChange={e => updateTier(idx, 'period', e.target.value)} placeholder="/mês" className="bg-background h-8 text-xs" />
                            <Input value={tier.ctaText} onChange={e => updateTier(idx, 'ctaText', e.target.value)} placeholder="Começar" className="bg-background h-8 text-xs" />
                        </div>
                        <Input value={tier.description} onChange={e => updateTier(idx, 'description', e.target.value)} placeholder="Descrição curta" className="bg-background h-8 text-xs" />
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Features (uma por linha)</Label>
                            <textarea
                                value={tier.features.join('\n')}
                                onChange={e => updateFeatures(idx, e.target.value)}
                                rows={3}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                            />
                        </div>
                        <label className="flex items-center gap-2 text-xs">
                            <input
                                type="checkbox"
                                checked={tier.highlighted}
                                onChange={e => updateTier(idx, 'highlighted', e.target.checked)}
                                className="rounded"
                            />
                            Destacar este plano
                        </label>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={addTier} className="w-full">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Plano
                </Button>
            </div>
        </div>
    )
}

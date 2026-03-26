'use client'

import type { FeaturesContent, FeatureItem } from '@/domain/entities'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

interface FeaturesEditorProps {
    content: FeaturesContent
    onChange: (content: FeaturesContent) => void
}

const ICON_OPTIONS = ['Zap', 'Shield', 'HeadphonesIcon', 'Star', 'Target', 'Clock', 'CheckCircle', 'Globe', 'Heart', 'Lightbulb', 'Rocket', 'Users']

export function FeaturesEditor({ content, onChange }: FeaturesEditorProps) {
    const updateField = (field: keyof FeaturesContent, value: unknown) => {
        onChange({ ...content, [field]: value })
    }

    const updateItem = (idx: number, field: keyof FeatureItem, value: string) => {
        const items = [...content.items]
        items[idx] = { ...items[idx], [field]: value }
        updateField('items', items)
    }

    const addItem = () => {
        updateField('items', [...content.items, { icon: 'Zap', title: '', description: '' }])
    }

    const removeItem = (idx: number) => {
        updateField('items', content.items.filter((_, i) => i !== idx))
    }

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-xs">Título da Seção</Label>
                    <Input value={content.title} onChange={e => updateField('title', e.target.value)} className="bg-background" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">Colunas</Label>
                    <select
                        value={content.columns}
                        onChange={e => updateField('columns', Number(e.target.value))}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                    </select>
                </div>
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Subtítulo</Label>
                <Input value={content.subtitle} onChange={e => updateField('subtitle', e.target.value)} className="bg-background" />
            </div>

            <div className="space-y-2 mt-4">
                <Label className="text-xs font-semibold">Itens ({content.items.length})</Label>
                {content.items.map((item, idx) => (
                    <div key={idx} className="p-3 border border-border rounded-md bg-secondary/20 space-y-2">
                        <div className="flex items-center gap-2">
                            <select
                                value={item.icon}
                                onChange={e => updateItem(idx, 'icon', e.target.value)}
                                className="h-8 rounded border border-input bg-background px-2 text-xs w-32"
                            >
                                {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                            </select>
                            <Input value={item.title} onChange={e => updateItem(idx, 'title', e.target.value)} placeholder="Título" className="bg-background h-8 text-xs" />
                            <button onClick={() => removeItem(idx)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <Textarea value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Descrição" rows={1} className="bg-background text-xs" />
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={addItem} className="w-full">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Item
                </Button>
            </div>
        </div>
    )
}

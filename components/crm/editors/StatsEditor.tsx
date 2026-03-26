'use client'

import type { StatsContent, StatItem } from '@/domain/entities'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

interface StatsEditorProps {
    content: StatsContent
    onChange: (content: StatsContent) => void
}

export function StatsEditor({ content, onChange }: StatsEditorProps) {
    const updateItem = (idx: number, field: keyof StatItem, value: string) => {
        const items = [...content.items]
        items[idx] = { ...items[idx], [field]: value }
        onChange({ ...content, items })
    }

    const addItem = () => {
        onChange({ ...content, items: [...content.items, { value: '0', label: '' }] })
    }

    const removeItem = (idx: number) => {
        onChange({ ...content, items: content.items.filter((_, i) => i !== idx) })
    }

    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <Label className="text-xs">Título</Label>
                <Input value={content.title} onChange={e => onChange({ ...content, title: e.target.value })} className="bg-background" />
            </div>

            <div className="space-y-2 mt-3">
                <Label className="text-xs font-semibold">Números ({content.items.length})</Label>
                {content.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <Input value={item.value} onChange={e => updateItem(idx, 'value', e.target.value)} placeholder="500+" className="bg-background h-8 text-xs w-24" />
                        <Input value={item.label} onChange={e => updateItem(idx, 'label', e.target.value)} placeholder="Clientes" className="bg-background h-8 text-xs flex-1" />
                        <button onClick={() => removeItem(idx)} className="p-1 text-destructive hover:bg-destructive/10 rounded shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={addItem} className="w-full">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                </Button>
            </div>
        </div>
    )
}

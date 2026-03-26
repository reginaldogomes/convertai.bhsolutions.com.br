'use client'

import type { TestimonialsContent, TestimonialItem } from '@/domain/entities'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

interface TestimonialsEditorProps {
    content: TestimonialsContent
    onChange: (content: TestimonialsContent) => void
}

export function TestimonialsEditor({ content, onChange }: TestimonialsEditorProps) {
    const updateItem = (idx: number, field: keyof TestimonialItem, value: string | number) => {
        const items = [...content.items]
        items[idx] = { ...items[idx], [field]: value }
        onChange({ ...content, items })
    }

    const addItem = () => {
        onChange({
            ...content,
            items: [...content.items, { name: '', role: '', company: '', avatarUrl: null, quote: '', rating: 5 }],
        })
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
                <Label className="text-xs font-semibold">Depoimentos ({content.items.length})</Label>
                {content.items.map((item, idx) => (
                    <div key={idx} className="p-3 border border-border rounded-md bg-secondary/20 space-y-2">
                        <div className="flex items-center gap-2">
                            <Input value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} placeholder="Nome" className="bg-background h-8 text-xs" />
                            <Input value={item.role} onChange={e => updateItem(idx, 'role', e.target.value)} placeholder="Cargo" className="bg-background h-8 text-xs" />
                            <button onClick={() => removeItem(idx)} className="p-1 text-destructive hover:bg-destructive/10 rounded shrink-0">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <Input value={item.company} onChange={e => updateItem(idx, 'company', e.target.value)} placeholder="Empresa" className="bg-background h-8 text-xs" />
                        <Textarea value={item.quote} onChange={e => updateItem(idx, 'quote', e.target.value)} placeholder="Depoimento" rows={2} className="bg-background text-xs" />
                        <div className="flex items-center gap-2">
                            <Label className="text-xs">Nota:</Label>
                            <select
                                value={item.rating}
                                onChange={e => updateItem(idx, 'rating', Number(e.target.value))}
                                className="h-7 rounded border border-input bg-background px-2 text-xs"
                            >
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} estrela{n > 1 ? 's' : ''}</option>)}
                            </select>
                        </div>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={addItem} className="w-full">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Depoimento
                </Button>
            </div>
        </div>
    )
}

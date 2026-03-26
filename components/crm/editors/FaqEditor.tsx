'use client'

import type { FaqContent, FaqItem } from '@/domain/entities'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

interface FaqEditorProps {
    content: FaqContent
    onChange: (content: FaqContent) => void
}

export function FaqEditor({ content, onChange }: FaqEditorProps) {
    const updateItem = (idx: number, field: keyof FaqItem, value: string) => {
        const items = [...content.items]
        items[idx] = { ...items[idx], [field]: value }
        onChange({ ...content, items })
    }

    const addItem = () => {
        onChange({ ...content, items: [...content.items, { question: '', answer: '' }] })
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
            <div className="space-y-1.5">
                <Label className="text-xs">Subtítulo</Label>
                <Input value={content.subtitle} onChange={e => onChange({ ...content, subtitle: e.target.value })} className="bg-background" />
            </div>

            <div className="space-y-2 mt-3">
                <Label className="text-xs font-semibold">Perguntas ({content.items.length})</Label>
                {content.items.map((item, idx) => (
                    <div key={idx} className="p-3 border border-border rounded-md bg-secondary/20 space-y-2">
                        <div className="flex items-center gap-2">
                            <Input value={item.question} onChange={e => updateItem(idx, 'question', e.target.value)} placeholder="Pergunta" className="bg-background h-8 text-xs" />
                            <button onClick={() => removeItem(idx)} className="p-1 text-destructive hover:bg-destructive/10 rounded shrink-0">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <Textarea value={item.answer} onChange={e => updateItem(idx, 'answer', e.target.value)} placeholder="Resposta" rows={2} className="bg-background text-xs" />
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={addItem} className="w-full">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Pergunta
                </Button>
            </div>
        </div>
    )
}

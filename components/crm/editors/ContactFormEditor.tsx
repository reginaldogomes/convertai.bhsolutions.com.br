'use client'

import type { ContactFormContent } from '@/domain/entities'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ContactFormEditorProps {
    content: ContactFormContent
    onChange: (content: ContactFormContent) => void
}

const ALL_FIELDS: Array<{ key: 'name' | 'email' | 'phone' | 'company' | 'message'; label: string }> = [
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'E-mail' },
    { key: 'phone', label: 'Telefone' },
    { key: 'company', label: 'Empresa' },
    { key: 'message', label: 'Mensagem' },
]

export function ContactFormEditor({ content, onChange }: ContactFormEditorProps) {
    const toggleField = (field: 'name' | 'email' | 'phone' | 'company' | 'message') => {
        const fields = content.fields.includes(field)
            ? content.fields.filter(f => f !== field)
            : [...content.fields, field]
        onChange({ ...content, fields })
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
            <div className="space-y-1.5">
                <Label className="text-xs">Texto do Botão</Label>
                <Input value={content.submitText} onChange={e => onChange({ ...content, submitText: e.target.value })} className="bg-background" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Mensagem de Sucesso</Label>
                <Input value={content.successMessage} onChange={e => onChange({ ...content, successMessage: e.target.value })} className="bg-background" />
            </div>
            <div className="space-y-2">
                <Label className="text-xs font-semibold">Campos do Formulário</Label>
                <div className="flex flex-wrap gap-2">
                    {ALL_FIELDS.map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-1.5 text-xs bg-secondary/30 px-2.5 py-1.5 rounded-md cursor-pointer">
                            <input
                                type="checkbox"
                                checked={content.fields.includes(key)}
                                onChange={() => toggleField(key)}
                                className="rounded"
                            />
                            {label}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    )
}

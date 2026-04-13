'use client'

import type { AboutExpertContent } from '@/domain/entities'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

interface AboutExpertEditorProps {
    content: AboutExpertContent
    onChange: (content: AboutExpertContent) => void
}

export function AboutExpertEditor({ content, onChange }: AboutExpertEditorProps) {
    const update = <K extends keyof AboutExpertContent>(field: K, value: AboutExpertContent[K]) => {
        onChange({ ...content, [field]: value })
    }

    const updateCredential = (idx: number, value: string) => {
        const credentials = [...content.credentials]
        credentials[idx] = value
        update('credentials', credentials)
    }

    const addCredential = () => {
        update('credentials', [...content.credentials, ''])
    }

    const removeCredential = (idx: number) => {
        update('credentials', content.credentials.filter((_, i) => i !== idx))
    }

    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <Label className="text-xs">Título da Seção</Label>
                <Input
                    value={content.sectionTitle}
                    onChange={e => update('sectionTitle', e.target.value)}
                    placeholder="Quem está por trás disso?"
                    className="bg-background"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-xs">Nome Completo</Label>
                    <Input
                        value={content.name}
                        onChange={e => update('name', e.target.value)}
                        placeholder="Ex: Ana Costa"
                        className="bg-background"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">Cargo / Especialidade</Label>
                    <Input
                        value={content.role}
                        onChange={e => update('role', e.target.value)}
                        placeholder="Ex: Nutricionista Clínica"
                        className="bg-background"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs">Foto / Avatar (URL)</Label>
                <Input
                    value={content.avatarUrl ?? ''}
                    onChange={e => update('avatarUrl', e.target.value || null)}
                    placeholder="https://..."
                    className="bg-background"
                />
                <p className="text-[10px] text-muted-foreground">Deixe em branco para usar as iniciais do nome.</p>
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs">Biografia</Label>
                <Textarea
                    value={content.bio}
                    onChange={e => update('bio', e.target.value)}
                    placeholder="Descreva trajetória, conquistas e o que torna o profissional a pessoa ideal para o cliente..."
                    rows={4}
                    className="bg-background"
                />
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-semibold">
                    Credenciais / Destaques ({content.credentials.length})
                </Label>
                {content.credentials.map((cred, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <Input
                            value={cred}
                            onChange={e => updateCredential(idx, e.target.value)}
                            placeholder="Ex: 10+ anos de experiência"
                            className="bg-background h-8 text-xs flex-1"
                        />
                        <button
                            type="button"
                            onClick={() => removeCredential(idx)}
                            className="p-1 text-destructive hover:bg-destructive/10 rounded shrink-0"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCredential}
                    className="w-full"
                >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Credencial
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-xs">URL "Conhecer Mais"</Label>
                    <Input
                        value={content.learnMoreUrl}
                        onChange={e => update('learnMoreUrl', e.target.value)}
                        placeholder="https://..."
                        className="bg-background"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">Texto do Link</Label>
                    <Input
                        value={content.learnMoreText}
                        onChange={e => update('learnMoreText', e.target.value)}
                        placeholder="Conhecer mais sobre mim"
                        className="bg-background"
                    />
                </div>
            </div>
        </div>
    )
}

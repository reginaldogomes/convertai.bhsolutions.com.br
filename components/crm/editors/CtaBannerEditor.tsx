'use client'

import type { CtaBannerContent } from '@/domain/entities'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CtaBannerEditorProps {
    content: CtaBannerContent
    onChange: (content: CtaBannerContent) => void
}

export function CtaBannerEditor({ content, onChange }: CtaBannerEditorProps) {
    const update = (field: keyof CtaBannerContent, value: string) => {
        onChange({ ...content, [field]: value })
    }

    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <Label className="text-xs">Título</Label>
                <Input value={content.title} onChange={e => update('title', e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Subtítulo</Label>
                <Input value={content.subtitle} onChange={e => update('subtitle', e.target.value)} className="bg-background" />
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
        </div>
    )
}

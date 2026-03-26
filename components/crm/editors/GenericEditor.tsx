'use client'

import { Label } from '@/components/ui/label'
import type { SectionContentMap, SectionType } from '@/domain/entities'

interface GenericEditorProps {
    content: SectionContentMap[SectionType]
    onChange: (content: SectionContentMap[SectionType]) => void
}

export function GenericEditor({ content, onChange }: GenericEditorProps) {
    const json = JSON.stringify(content, null, 2)

    return (
        <div className="space-y-2">
            <Label className="text-xs">Conteúdo (JSON)</Label>
            <textarea
                value={json}
                onChange={e => {
                    try {
                        const parsed = JSON.parse(e.target.value)
                        onChange(parsed)
                    } catch {
                        // Don't update on invalid JSON
                    }
                }}
                rows={8}
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
            />
        </div>
    )
}

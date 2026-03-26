'use client'

import type { VideoContent } from '@/domain/entities'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface VideoEditorProps {
    content: VideoContent
    onChange: (content: VideoContent) => void
}

export function VideoEditor({ content, onChange }: VideoEditorProps) {
    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <Label className="text-xs">Título</Label>
                <Input value={content.title} onChange={e => onChange({ ...content, title: e.target.value })} className="bg-background" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">URL do Vídeo</Label>
                <Input value={content.videoUrl} onChange={e => onChange({ ...content, videoUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." className="bg-background" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Plataforma</Label>
                <select
                    value={content.provider}
                    onChange={e => onChange({ ...content, provider: e.target.value as 'youtube' | 'vimeo' })}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                </select>
            </div>
        </div>
    )
}

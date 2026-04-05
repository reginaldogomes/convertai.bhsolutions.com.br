'use client'

import { useState, useTransition } from 'react'
import { Switch } from '@/components/ui/switch'
import { publishLandingPage } from '@/actions/landing-pages'
import { Loader2 } from 'lucide-react'

interface PublishToggleButtonProps {
    pageId: string
    isPublished: boolean
}

export function PublishToggleButton({ pageId, isPublished }: PublishToggleButtonProps) {
    const [isPending, startTransition] = useTransition()
    const [localIsPublished, setLocalIsPublished] = useState(isPublished)

    const handleToggle = () => {
        const newStatus = !localIsPublished
        setLocalIsPublished(newStatus)
        startTransition(async () => {
            const result = await publishLandingPage(pageId, newStatus)
            if (result?.error) {
                // Se der erro, reverte o estado visual
                setLocalIsPublished(!newStatus)
            }
        })
    }

    return (
        <div className="flex items-center gap-2">
            <Switch
                checked={localIsPublished}
                onCheckedChange={handleToggle}
                disabled={isPending}
                aria-label="Publicar landing page"
            />
            {isPending && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
    )
}

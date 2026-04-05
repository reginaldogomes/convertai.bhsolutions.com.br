'use client'

import { useState } from 'react'
import { syncProductKnowledgeBase } from '@/actions/landing-pages'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export function SyncProductKnowledgeButton({ pageId }: { pageId: string }) {
    const [isPending, setIsPending] = useState(false)
    const [message, setMessage] = useState('')

    const handleSync = async () => {
        setIsPending(true)
        setMessage('')
        try {
            const result = await syncProductKnowledgeBase(pageId)
            if (result.success) {
                setMessage(result.message ?? 'Sincronizado!')
            } else {
                setMessage(result.error)
            }
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSync} disabled={isPending}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
                {isPending ? 'Sincronizando...' : 'Sincronizar Produto'}
            </Button>
            {message && <span className="text-xs text-muted-foreground">{message}</span>}
        </div>
    )
}

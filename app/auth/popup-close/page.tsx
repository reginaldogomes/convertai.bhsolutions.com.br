'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function PopupClosePage() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    useEffect(() => {
        if (!window.opener) {
            // Não é um popup — redirecionar para login
            window.location.href = error ? `/login?error=${error}` : '/'
            return
        }

        window.opener.postMessage(
            error ? { type: 'oauth-error', error } : { type: 'oauth-success' },
            window.location.origin,
        )

        window.close()
    }, [error])

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Concluindo autenticação...</span>
            </div>
        </div>
    )
}

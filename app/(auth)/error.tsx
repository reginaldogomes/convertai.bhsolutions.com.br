'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { TriangleAlert } from 'lucide-react'

export default function AuthError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => { console.error(error) }, [error])

    const safeMessage = error.message && !error.message.startsWith('An error occurred')
        ? error.message
        : 'Ocorreu um erro inesperado.'

    return (
        <div className="space-y-6 text-center">
            <div className="w-12 h-12 bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto rounded-(--radius)">
                <TriangleAlert className="w-5 h-5 text-destructive" />
            </div>
            <div>
                <h2 className="text-foreground text-lg font-bold">Erro</h2>
                <p className="text-muted-foreground text-sm mt-2">{safeMessage}</p>
            </div>
            <Button
                onClick={reset}
                variant="outline"
                className="h-9 px-5 text-xs font-bold uppercase tracking-wider"
            >
                Tentar Novamente
            </Button>
        </div>
    )
}

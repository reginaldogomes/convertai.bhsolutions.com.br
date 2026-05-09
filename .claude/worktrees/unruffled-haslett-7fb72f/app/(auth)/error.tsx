'use client'

import { Button } from '@/components/ui/button'
import { TriangleAlert } from 'lucide-react'

export default function AuthError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const safeMessage = error.message && !error.message.startsWith('An error occurred')
        ? error.message
        : 'Ocorreu um erro durante a autenticação.'

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
            <div className="text-center space-y-4 max-w-sm">
                <div className="w-12 h-12 bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto rounded-(--radius)">
                    <TriangleAlert className="w-5 h-5 text-destructive" />
                </div>
                <h2 className="text-foreground text-lg font-bold">Erro de Autenticação</h2>
                <p className="text-muted-foreground text-sm">{safeMessage}</p>
                <Button
                    onClick={reset}
                    variant="outline"
                    className="h-9 px-5 text-xs font-bold uppercase tracking-wider"
                >
                    Tentar Novamente
                </Button>
            </div>
        </div>
    )
}

'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { TriangleAlert } from 'lucide-react'

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => { console.error(error) }, [error])

    // Em produção o Next.js sanitiza error.message de erros de servidor.
    // Exibimos a mensagem apenas quando ela é claramente voltada ao usuário
    // (erros de domínio chegam via Error boundary com mensagem já traduzida).
    const safeMessage = error.message && !error.message.startsWith('An error occurred')
        ? error.message
        : 'Ocorreu um erro inesperado.'

    return (
        <div className="flex-1 flex items-center justify-center p-10">
            <div className="text-center space-y-4 max-w-md">
                <div className="w-12 h-12 bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto rounded-(--radius)">
                    <TriangleAlert className="w-5 h-5 text-destructive" />
                </div>
                <h2 className="text-foreground text-lg font-bold">Algo deu errado</h2>
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

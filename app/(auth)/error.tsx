'use client'

export default function AuthError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div className="space-y-6 text-center">
            <div className="w-12 h-12 bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto rounded-[var(--radius)]">
                <span className="text-destructive text-xl">!</span>
            </div>
            <div>
                <h2 className="text-foreground text-lg font-bold">Erro</h2>
                <p className="text-muted-foreground text-sm mt-2">{error.message || 'Ocorreu um erro inesperado.'}</p>
            </div>
            <button
                onClick={reset}
                className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white px-6 h-9 font-bold uppercase tracking-wider text-xs transition-colors rounded-[var(--radius)]"
            >
                Tentar Novamente
            </button>
        </div>
    )
}

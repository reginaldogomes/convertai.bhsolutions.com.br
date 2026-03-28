'use client'

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div className="flex-1 flex items-center justify-center p-10">
            <div className="text-center space-y-4 max-w-md">
                <div className="w-12 h-12 bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto rounded-(--radius)">
                    <span className="text-destructive text-xl">!</span>
                </div>
                <h2 className="text-foreground text-lg font-bold">Algo deu errado</h2>
                <p className="text-muted-foreground text-sm">{error.message || 'Ocorreu um erro inesperado.'}</p>
                <button
                    onClick={reset}
                    className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white px-6 h-9 font-bold uppercase tracking-wider text-xs transition-colors rounded-(--radius)"
                >
                    Tentar Novamente
                </button>
            </div>
        </div>
    )
}

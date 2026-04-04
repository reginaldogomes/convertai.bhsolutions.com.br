'use client'

import { useState, useTransition } from 'react'
import { Trash2, X, AlertTriangle } from 'lucide-react'
import { deleteLandingPage } from '@/actions/landing-pages'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface DeleteLandingPageButtonProps {
    pageId: string
    pageName: string
    redirectAfterDelete?: boolean
}

export function DeleteLandingPageButton({ pageId, pageName, redirectAfterDelete }: DeleteLandingPageButtonProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteLandingPage(pageId)
            if (result.success && redirectAfterDelete) {
                router.push('/landing-pages')
            }
        })
    }

    return (
        <>
            <Button
                variant="destructive"
                size="sm"
                onClick={() => setOpen(true)}
                className="h-8 px-3 text-xs font-bold uppercase tracking-wider rounded-(--radius)"
            >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Apagar
            </Button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="del-lp-title"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    {/* Panel */}
                    <div className="relative w-full max-w-sm rounded-(--radius) bg-card border border-border shadow-2xl p-6">
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Fechar"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                            </div>
                            <div>
                                <h3 id="del-lp-title" className="text-foreground font-black text-base tracking-tight">
                                    Apagar landing page?
                                </h3>
                                <p className="text-muted-foreground text-xs mt-0.5">Esta ação não pode ser desfeita.</p>
                            </div>
                        </div>

                        <p className="text-foreground-secondary text-sm leading-relaxed mb-6">
                            A landing page <strong className="text-foreground">{pageName}</strong> e todos os seus dados
                            (seções, base de conhecimento, analytics) serão removidos permanentemente.
                        </p>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 h-9 text-xs font-bold uppercase tracking-wider rounded-(--radius)"
                                onClick={() => setOpen(false)}
                                disabled={isPending}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1 h-9 text-xs font-bold uppercase tracking-wider rounded-(--radius)"
                                onClick={handleDelete}
                                disabled={isPending}
                            >
                                {isPending ? 'Apagando...' : 'Sim, apagar'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

'use client'

import { useState, useActionState } from 'react'
import { ShoppingCart, Loader2, Zap, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { InlineNotice } from '@/components/ui/inline-notice'
import { requestCreditPurchase } from '@/actions/payment'
import type { PlainCreditPack } from '@/app/(dashboard)/settings/settings-tabs'

interface BuyCreditsButtonProps {
    packs: PlainCreditPack[]
}

export function BuyCreditsButton({ packs }: BuyCreditsButtonProps) {
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState<string | null>(null)
    const [state, formAction, isPending] = useActionState(requestCreditPurchase, null)

    const handleOpenChange = (value: boolean) => {
        setOpen(value)
        if (!value) {
            setSelected(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="h-9 px-5 text-xs font-bold uppercase tracking-wider gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Comprar Créditos
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        Comprar Créditos
                    </DialogTitle>
                </DialogHeader>

                <form action={formAction} className="space-y-3">
                    {state?.error && (
                        <InlineNotice variant="destructive" message={state.error} className="mb-2" size="sm" />
                        )}

                        <p className="text-muted-foreground text-sm">Escolha um pacote de créditos:</p>

                    <div className="space-y-2">
                            {packs.map((pack) => (
                                <button
                                    key={pack.id}
                                    type="button"
                                    onClick={() => setSelected(pack.id)}
                                    className={[
                                        'w-full flex items-center justify-between p-4 rounded-(--radius) border text-left transition-colors',
                                        selected === pack.id
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border bg-[hsl(var(--background-tertiary))] hover:border-primary/50',
                                    ].join(' ')}
                                >
                                    <div>
                                        <p className="text-foreground font-semibold text-sm">{pack.name}</p>
                                        <p className="text-muted-foreground text-xs">{pack.credits.toLocaleString('pt-BR')} créditos · {pack.costPerCredit}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-foreground font-bold text-base">{pack.formattedPrice}</span>
                                        {selected === pack.id && <Check className="w-4 h-4 text-primary" />}
                                    </div>
                                </button>
                            ))}
                        </div>

                    <input type="hidden" name="packId" value={selected ?? ''} />

                    <Button
                        type="submit"
                            disabled={!selected || isPending}
                            className="w-full h-9 text-xs font-bold uppercase tracking-wider"
                        >
                            {isPending ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
                            ) : (
                                <><ShoppingCart className="w-4 h-4 mr-2" /> Confirmar Compra</>
                            )}
                        </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

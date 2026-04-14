'use client'

import { useState, useTransition } from 'react'
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
import type { PlainCreditPack } from '@/app/(dashboard)/settings/settings-tabs'

interface BuyCreditsButtonProps {
    packs: PlainCreditPack[]
}

export function BuyCreditsButton({ packs }: BuyCreditsButtonProps) {
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState<string | null>(null)
    const [result, setResult] = useState<{ success?: boolean; error?: string; checkoutUrl?: string; packName?: string; priceBrl?: string } | null>(null)
    const [isPending, startTransition] = useTransition()

    const handleBuy = () => {
        if (!selected) return
        startTransition(async () => {
            const formData = new FormData()
            formData.append('packId', selected)
            // requestCreditPurchase is async, import dynamically to avoid bundling in client
            const { requestCreditPurchase } = await import('@/actions/saas')
            const res = await requestCreditPurchase(null, formData)
            setResult(res)
        })
    }

    const handleOpenChange = (value: boolean) => {
        setOpen(value)
        if (!value) { setSelected(null); setResult(null) }
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

                {result?.success ? (
                    <div className="space-y-4">
                        <InlineNotice variant="success" message={`Redirecionando para checkout: ${result.packName} — ${result.priceBrl}`} />
                        <Button asChild className="w-full">
                            <a href={result.checkoutUrl ?? '#'}>Ir para checkout</a>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {result?.error && (
                            <InlineNotice variant="destructive" message={result.error} className="mb-2" size="sm" />
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

                        <Button
                            onClick={handleBuy}
                            disabled={!selected || isPending}
                            className="w-full h-9 text-xs font-bold uppercase tracking-wider"
                        >
                            {isPending ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
                            ) : (
                                <><ShoppingCart className="w-4 h-4 mr-2" /> Confirmar Compra</>
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

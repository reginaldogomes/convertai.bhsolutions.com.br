'use client'

import { useState, useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteProduct } from '@/actions/products'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { DangerConfirmationHeader } from '@/components/ui/danger-confirmation-header'

interface DeleteProductButtonProps {
    productId: string
    productName: string
    redirectAfterDelete?: boolean
}

export function DeleteProductButton({ productId, productName, redirectAfterDelete }: DeleteProductButtonProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteProduct(productId)
            if (result.success && redirectAfterDelete) {
                router.push('/products')
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 px-3 text-xs font-bold uppercase tracking-wider rounded-(--radius)"
                >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Apagar
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm bg-card border-border p-0 gap-0">
                <DialogHeader className="p-6 pb-4">
                    <DangerConfirmationHeader title="Apagar produto?" />
                </DialogHeader>

                <div className="px-6 pb-4">
                    <p className="text-foreground-secondary text-sm leading-relaxed">
                        O produto <strong className="text-foreground">{productName}</strong> será removido permanentemente.
                        Landing pages associadas perderão a referência ao produto.
                    </p>
                </div>

                <DialogFooter className="px-6 pb-6 pt-2 flex gap-3 sm:gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="flex-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isPending}
                        className="flex-1"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                Apagando...
                            </>
                        ) : (
                            'Sim, apagar'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

'use client'

import { useTransition } from 'react'
import { toggleProductStatus } from '@/actions/products'
import { Button } from '@/components/ui/button'
import { Power, Archive, Loader2 } from 'lucide-react'

interface ToggleProductStatusButtonProps {
    productId: string
    isActive: boolean
}

export function ToggleProductStatusButton({ productId, isActive }: ToggleProductStatusButtonProps) {
    const [isPending, startTransition] = useTransition()

    const handleToggle = () => {
        startTransition(async () => {
            await toggleProductStatus(productId, !isActive)
        })
    }

    return (
        <Button
            variant={isActive ? 'outline' : 'default'}
            size="sm"
            onClick={handleToggle}
            disabled={isPending}
            className="h-8 px-3 text-xs font-bold uppercase tracking-wider rounded-(--radius) transition-all duration-200"
        >
            {isPending ? (
                <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    {isActive ? 'Arquivando...' : 'Ativando...'}
                </>
            ) : isActive ? (
                <>
                    <Archive className="w-3.5 h-3.5 mr-1.5" />
                    Arquivar
                </>
            ) : (
                <>
                    <Power className="w-3.5 h-3.5 mr-1.5" />
                    Ativar
                </>
            )}
        </Button>
    )
}

'use client'

import { useActionState } from 'react'
import { ShieldOff, Loader2 } from 'lucide-react'
import { demoteFromSuperAdmin } from '@/actions/admin'
import { Button } from '@/components/ui/button'

interface RevokeSuperAdminButtonProps {
    userId: string
    isSelf: boolean
}

export function RevokeSuperAdminButton({ userId, isSelf }: RevokeSuperAdminButtonProps) {
    const [, action, pending] = useActionState(demoteFromSuperAdmin, { error: '', success: false })

    if (isSelf) {
        return (
            <span className="text-muted-foreground/40 text-xs italic">você mesmo</span>
        )
    }

    return (
        <form action={action}>
            <input type="hidden" name="userId" value={userId} />
            <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={pending}
                className="h-7 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 font-bold uppercase tracking-wider gap-1"
            >
                {pending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                    <ShieldOff className="w-3 h-3" />
                )}
                Revogar
            </Button>
        </form>
    )
}

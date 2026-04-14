'use client'

import { useActionState, useState } from 'react'
import { Gift, Loader2 } from 'lucide-react'
import { adminGrantCredits } from '@/actions/saas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { InlineNotice } from '@/components/ui/inline-notice'

interface GrantCreditsButtonProps {
    orgId: string
    orgName: string
}

export function GrantCreditsButton({ orgId, orgName }: GrantCreditsButtonProps) {
    const [open, setOpen] = useState(false)
    const [state, action, pending] = useActionState(adminGrantCredits, { error: '', success: false })

    const handleOpenChange = (value: boolean) => {
        setOpen(value)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-bold uppercase tracking-wider gap-1.5">
                    <Gift className="w-3.5 h-3.5" />
                    Conceder Créditos
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <Gift className="w-5 h-5 text-primary" />
                        Conceder Créditos
                    </DialogTitle>
                </DialogHeader>

                <p className="text-muted-foreground text-sm -mt-2">
                    Adicionando créditos para <strong className="text-foreground">{orgName}</strong>
                </p>

                <form action={action} className="space-y-4">
                    <input type="hidden" name="orgId" value={orgId} />

                    <div className="space-y-1.5">
                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Quantidade</Label>
                        <Input
                            name="amount"
                            type="number"
                            min="1"
                            max="1000000"
                            placeholder="ex: 500"
                            required
                            className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Motivo</Label>
                        <Textarea
                            name="reason"
                            placeholder="ex: Bônus de boas-vindas"
                            required
                            rows={2}
                            className="bg-[hsl(var(--background-tertiary))] border-border text-foreground resize-none"
                        />
                    </div>

                    {state.success && (
                        <InlineNotice variant="success" message="Créditos concedidos com sucesso." size="sm" />
                    )}
                    {state.error && (
                        <InlineNotice variant="destructive" message={state.error} size="sm" />
                    )}

                    <Button
                        type="submit"
                        disabled={pending}
                        className="w-full h-9 text-xs font-bold uppercase tracking-wider"
                    >
                        {pending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Concedendo...</>
                        ) : (
                            <><Gift className="w-4 h-4 mr-2" /> Conceder Créditos</>
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

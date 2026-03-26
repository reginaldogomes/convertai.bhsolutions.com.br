'use client'

import { useState, useRef } from 'react'
import { useActionState } from 'react'
import { createContact } from '@/actions/contacts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useEffect } from 'react'

const initialState: { error: string; success: boolean } = { error: '', success: false }

export function AddContactButton() {
    const [open, setOpen] = useState(false)
    const [state, action] = useActionState(createContact, initialState)
    const formRef = useRef<HTMLFormElement>(null)

    useEffect(() => {
        if (state?.success) {
            toast.success('Contato adicionado com sucesso!')
            queueMicrotask(() => {
                formRef.current?.reset()
                setOpen(false)
            })
        } else if (state?.error) {
            toast.error(state.error)
        }
    }, [state])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white h-8 px-3 text-xs font-bold uppercase tracking-wider rounded-[var(--radius)]">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Novo Contato
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[hsl(var(--background-tertiary))] border-border rounded-[var(--radius)] sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle className="text-foreground text-lg font-black tracking-tight">Novo Contato</DialogTitle>
                </DialogHeader>
                <form ref={formRef} action={action} className="space-y-4 py-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-foreground-secondary text-xs uppercase tracking-wider">Nome</Label>
                        <Input required id="name" name="name"
                            className="bg-secondary border-border text-foreground focus:border-primary rounded-[var(--radius)] h-9 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-foreground-secondary text-xs uppercase tracking-wider">Email</Label>
                            <Input type="email" id="email" name="email"
                                className="bg-secondary border-border text-foreground focus:border-primary rounded-[var(--radius)] h-9 text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phone" className="text-foreground-secondary text-xs uppercase tracking-wider">Telefone / WhatsApp</Label>
                            <Input id="phone" name="phone" placeholder="+5511999999999"
                                className="bg-secondary border-border text-foreground focus:border-primary rounded-[var(--radius)] h-9 text-sm" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="company" className="text-foreground-secondary text-xs uppercase tracking-wider">Empresa</Label>
                        <Input id="company" name="company"
                            className="bg-secondary border-border text-foreground focus:border-primary rounded-[var(--radius)] h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="tags" className="text-foreground-secondary text-xs uppercase tracking-wider">Tags (separadas por vírgula)</Label>
                        <Input id="tags" name="tags" placeholder="lead, b2b, parceiro"
                            className="bg-secondary border-border text-foreground focus:border-primary rounded-[var(--radius)] h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="notes" className="text-foreground-secondary text-xs uppercase tracking-wider">Observações</Label>
                        <Textarea id="notes" name="notes" rows={3}
                            className="bg-secondary border-border text-foreground focus:border-primary rounded-[var(--radius)] text-sm resize-none" />
                    </div>

                    {state?.error && (
                        <p className="text-destructive text-xs border border-destructive/20 bg-destructive/5 px-3 py-2 rounded-[var(--radius)]">{state.error}</p>
                    )}

                    <Button type="submit" className="w-full bg-primary hover:bg-[hsl(var(--primary-hover))] text-white rounded-[var(--radius)] h-9 font-bold uppercase tracking-wider text-xs">
                        Salvar Contato
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

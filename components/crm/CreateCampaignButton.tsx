'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createCampaign } from '@/actions/campaigns'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const initialState = { error: '', success: false }

export function CreateCampaignButton() {
    const [open, setOpen] = useState(false)
    const [state, action] = useActionState(createCampaign, initialState)
    const router = useRouter()

    useEffect(() => {
        if (state?.success) {
            toast.success('Campanha criada com sucesso!')
            queueMicrotask(() => {
                setOpen(false)
                router.refresh()
            })
        } else if (state?.error) {
            toast.error(state.error)
        }
    }, [state, router])

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white h-8 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-[var(--radius)]"
            >
                <Plus className="w-3.5 h-3.5" />
                Nova Campanha
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-[hsl(var(--background-tertiary))] border-border rounded-[var(--radius)] sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-foreground text-lg font-black tracking-tight">Nova Campanha</DialogTitle>
                    </DialogHeader>
                    <form action={action} className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-foreground-secondary text-xs uppercase tracking-wider">Nome da Campanha</Label>
                            <Input
                                required
                                id="name"
                                name="name"
                                placeholder="Ex: Newsletter Março 2026"
                                className="bg-secondary border-border text-foreground rounded-[var(--radius)] h-9 text-sm focus:border-primary"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="subject" className="text-foreground-secondary text-xs uppercase tracking-wider">Assunto do Email</Label>
                            <Input
                                id="subject"
                                name="subject"
                                placeholder="Ex: Novidades que vão transformar seu negócio"
                                className="bg-secondary border-border text-foreground rounded-[var(--radius)] h-9 text-sm focus:border-primary"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="body" className="text-foreground-secondary text-xs uppercase tracking-wider">Conteúdo (HTML)</Label>
                            <Textarea
                                id="body"
                                name="body"
                                rows={6}
                                placeholder={"<h1>Olá {{nome}}</h1>\n<p>Seu conteúdo aqui...</p>"}
                                className="bg-secondary border-border text-foreground rounded-[var(--radius)] text-sm focus:border-primary resize-none font-mono text-xs"
                            />
                            <p className="text-muted-foreground text-[10px]">
                                Use {"{{nome}}"} e {"{{email}}"} para personalização. HTML é suportado.
                            </p>
                        </div>

                        {state?.error && (
                            <p className="text-destructive text-xs border border-destructive/20 bg-destructive/5 px-3 py-2 rounded-[var(--radius)]">{state.error}</p>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                className="text-foreground-secondary rounded-[var(--radius)] h-9"
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white rounded-[var(--radius)] h-9 font-bold uppercase tracking-wider text-xs">
                                Criar Campanha
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

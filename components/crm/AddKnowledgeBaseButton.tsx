'use client'

import { useActionState } from 'react'
import { addKnowledgeBaseEntry } from '@/actions/landing-pages'
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
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

export function AddKnowledgeBaseButton({ landingPageId }: { landingPageId?: string }) {
    const [open, setOpen] = useState(false)
    const [state, action, isPending] = useActionState(addKnowledgeBaseEntry, { error: '', success: false })

    useEffect(() => {
        if (state.success) setOpen(false)
    }, [state.success])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Conteúdo
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Adicionar à Base de Conhecimento</DialogTitle>
                </DialogHeader>
                <form action={action} className="space-y-4">
                    {landingPageId && (
                        <input type="hidden" name="landingPageId" value={landingPageId} />
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="title">Título</Label>
                        <Input id="title" name="title" placeholder="Ex: Sobre nossos serviços" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="content">Conteúdo</Label>
                        <Textarea id="content" name="content"
                            placeholder="Cole aqui informações sobre seu produto, FAQ, descrição de serviços..."
                            rows={8} required />
                        <p className="text-xs text-muted-foreground">
                            Esse conteúdo será usado pelo chatbot para responder perguntas (RAG).
                        </p>
                    </div>

                    {state.error && (
                        <p className="text-sm text-destructive">{state.error}</p>
                    )}

                    <Button type="submit" disabled={isPending} className="w-full">
                        {isPending ? 'Salvando...' : 'Salvar Conteúdo'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

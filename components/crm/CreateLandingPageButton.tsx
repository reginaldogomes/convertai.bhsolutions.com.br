'use client'

import { useActionState } from 'react'
import { createLandingPage } from '@/actions/landing-pages'
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

export function CreateLandingPageButton() {
    const [open, setOpen] = useState(false)
    const [state, action, isPending] = useActionState(createLandingPage, { error: '', success: false })

    useEffect(() => {
        if (state.success) setOpen(false)
    }, [state.success])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Landing Page
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-card-foreground">Criar Landing Page</DialogTitle>
                </DialogHeader>
                <form action={action} className="space-y-5">
                    {/* Informações básicas */}
                    <fieldset className="space-y-4 rounded-md border border-border p-4">
                        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Informações
                        </legend>
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-sm font-medium text-card-foreground">Nome</Label>
                            <Input id="name" name="name" placeholder="Minha Landing Page" required
                                className="bg-background border-input" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="slug" className="text-sm font-medium text-card-foreground">Slug (URL)</Label>
                            <Input id="slug" name="slug" placeholder="minha-landing-page" required
                                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                                title="Apenas letras minúsculas, números e hifens"
                                className="bg-background border-input" />
                            <p className="text-xs text-muted-foreground">URL: /p/seu-slug</p>
                        </div>
                    </fieldset>

                    {/* Conteúdo */}
                    <fieldset className="space-y-4 rounded-md border border-border p-4">
                        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Conteúdo
                        </legend>
                        <div className="space-y-1.5">
                            <Label htmlFor="headline" className="text-sm font-medium text-card-foreground">Título Principal</Label>
                            <Input id="headline" name="headline" placeholder="Transforme seu negócio"
                                className="bg-background border-input" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="subheadline" className="text-sm font-medium text-card-foreground">Subtítulo</Label>
                            <Textarea id="subheadline" name="subheadline" placeholder="Descrição breve do seu produto..." rows={2}
                                className="bg-background border-input" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="chatbotName" className="text-sm font-medium text-card-foreground">Nome do Bot</Label>
                                <Input id="chatbotName" name="chatbotName" placeholder="Assistente"
                                    className="bg-background border-input" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ctaText" className="text-sm font-medium text-card-foreground">Texto do CTA</Label>
                                <Input id="ctaText" name="ctaText" placeholder="Fale conosco"
                                    className="bg-background border-input" />
                            </div>
                        </div>
                    </fieldset>

                    {/* Chatbot */}
                    <fieldset className="space-y-4 rounded-md border border-border p-4">
                        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Chatbot
                        </legend>
                        <div className="space-y-1.5">
                            <Label htmlFor="chatbotWelcomeMessage" className="text-sm font-medium text-card-foreground">Mensagem de Boas-vindas</Label>
                            <Textarea id="chatbotWelcomeMessage" name="chatbotWelcomeMessage" placeholder="Olá! Como posso ajudar?" rows={2}
                                className="bg-background border-input" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="chatbotSystemPrompt" className="text-sm font-medium text-card-foreground">Instruções do Bot (System Prompt)</Label>
                            <Textarea id="chatbotSystemPrompt" name="chatbotSystemPrompt"
                                placeholder="Você é um assistente especializado em..." rows={3}
                                className="bg-background border-input" />
                        </div>
                    </fieldset>

                    {state.error && (
                        <p className="text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                            {state.error}
                        </p>
                    )}

                    <Button type="submit" disabled={isPending} className="w-full h-10 text-sm font-semibold">
                        {isPending ? 'Criando...' : 'Criar Landing Page'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

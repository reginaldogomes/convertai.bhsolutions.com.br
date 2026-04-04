'use client'

import { useActionState } from 'react'
import { createProduct } from '@/actions/products'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

export function CreateProductButton() {
    const [open, setOpen] = useState(false)
    const [state, action, isPending] = useActionState(createProduct, { error: '', success: false })

    useEffect(() => {
        if (state.success) setOpen(false)
    }, [state.success])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Produto
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-card-foreground">Cadastrar Produto / Serviço</DialogTitle>
                </DialogHeader>
                <form action={action} className="space-y-5">
                    {/* Informações básicas */}
                    <fieldset className="space-y-4 rounded-md border border-border p-4">
                        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Informações Básicas
                        </legend>
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-sm font-medium text-card-foreground">Nome</Label>
                            <Input id="name" name="name" placeholder="Ex: Curso de Marketing Digital" required
                                className="bg-background border-input" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="slug" className="text-sm font-medium text-card-foreground">Slug (URL)</Label>
                            <Input id="slug" name="slug" placeholder="curso-marketing-digital" required
                                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                                title="Apenas letras minúsculas, números e hifens"
                                className="bg-background border-input" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="type" className="text-sm font-medium text-card-foreground">Tipo</Label>
                            <Select name="type" defaultValue="product">
                                <SelectTrigger className="bg-background border-input">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="product">Produto Digital</SelectItem>
                                    <SelectItem value="service">Serviço Digital</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </fieldset>

                    {/* Descrições */}
                    <fieldset className="space-y-4 rounded-md border border-border p-4">
                        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Descrição
                        </legend>
                        <div className="space-y-1.5">
                            <Label htmlFor="shortDescription" className="text-sm font-medium text-card-foreground">Descrição Curta</Label>
                            <Input id="shortDescription" name="shortDescription"
                                placeholder="Uma frase que resume o produto..."
                                className="bg-background border-input" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="fullDescription" className="text-sm font-medium text-card-foreground">Descrição Completa</Label>
                            <Textarea id="fullDescription" name="fullDescription"
                                placeholder="Descreva em detalhes o que é o produto, para quem é, e como funciona..."
                                rows={4}
                                className="bg-background border-input" />
                        </div>
                    </fieldset>

                    {/* Preço */}
                    <fieldset className="space-y-4 rounded-md border border-border p-4">
                        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Precificação
                        </legend>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="price" className="text-sm font-medium text-card-foreground">Preço (R$)</Label>
                                <Input id="price" name="price" type="number" step="0.01" min="0"
                                    placeholder="197.00"
                                    className="bg-background border-input" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="priceType" className="text-sm font-medium text-card-foreground">Tipo de Cobrança</Label>
                                <Select name="priceType">
                                    <SelectTrigger className="bg-background border-input">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="one_time">Pagamento Único</SelectItem>
                                        <SelectItem value="monthly">Mensal</SelectItem>
                                        <SelectItem value="yearly">Anual</SelectItem>
                                        <SelectItem value="custom">Personalizado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </fieldset>

                    {/* Público & Diferenciais */}
                    <fieldset className="space-y-4 rounded-md border border-border p-4">
                        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Público e Diferenciais
                        </legend>
                        <div className="space-y-1.5">
                            <Label htmlFor="targetAudience" className="text-sm font-medium text-card-foreground">Público-alvo</Label>
                            <Textarea id="targetAudience" name="targetAudience"
                                placeholder="Descreva quem é o cliente ideal deste produto..."
                                rows={2}
                                className="bg-background border-input" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="differentials" className="text-sm font-medium text-card-foreground">Diferenciais</Label>
                            <Textarea id="differentials" name="differentials"
                                placeholder="O que torna este produto único no mercado..."
                                rows={2}
                                className="bg-background border-input" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="tags" className="text-sm font-medium text-card-foreground">Tags</Label>
                            <Input id="tags" name="tags"
                                placeholder="marketing, digital, curso (separados por vírgula)"
                                className="bg-background border-input" />
                        </div>
                    </fieldset>

                    {state.error && (
                        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-(--radius) px-3 py-2">
                            {state.error}
                        </p>
                    )}

                    <Button type="submit" disabled={isPending} className="w-full">
                        {isPending ? 'Criando...' : 'Criar Produto'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

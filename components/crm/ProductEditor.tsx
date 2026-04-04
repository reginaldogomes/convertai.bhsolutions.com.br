'use client'

import { useActionState, useState } from 'react'
import { updateProduct } from '@/actions/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Save, Plus, X } from 'lucide-react'
import type { ProductFeature, ProductBenefit, ProductFaq } from '@/domain/entities'

interface ProductEditorProps {
    product: {
        id: string
        name: string
        slug: string
        type: string
        shortDescription: string
        fullDescription: string
        price: number | null
        priceType: string | null
        currency: string
        targetAudience: string
        differentials: string
        tags: string[]
        features: ProductFeature[]
        benefits: ProductBenefit[]
        faqs: ProductFaq[]
    }
}

export function ProductEditor({ product }: ProductEditorProps) {
    const updateWithId = updateProduct.bind(null, product.id)
    const [state, action, isPending] = useActionState(updateWithId, { error: '', success: false })

    const [features, setFeatures] = useState<ProductFeature[]>(product.features)
    const [benefits, setBenefits] = useState<ProductBenefit[]>(product.benefits)
    const [faqs, setFaqs] = useState<ProductFaq[]>(product.faqs)

    return (
        <form action={action} className="space-y-6">
            {/* Hidden JSON fields */}
            <input type="hidden" name="featuresJson" value={JSON.stringify(features)} />
            <input type="hidden" name="benefitsJson" value={JSON.stringify(benefits)} />
            <input type="hidden" name="faqsJson" value={JSON.stringify(faqs)} />

            {/* Informações básicas */}
            <fieldset className="space-y-4 rounded-md border border-border p-4">
                <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Informações Básicas
                </legend>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-sm font-medium">Nome</Label>
                        <Input id="name" name="name" defaultValue={product.name}
                            className="bg-background border-input" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="slug" className="text-sm font-medium">Slug</Label>
                        <Input id="slug" name="slug" defaultValue={product.slug}
                            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                            className="bg-background border-input" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="type" className="text-sm font-medium">Tipo</Label>
                    <Select name="type" defaultValue={product.type}>
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
                    <Label htmlFor="shortDescription" className="text-sm font-medium">Descrição Curta</Label>
                    <Input id="shortDescription" name="shortDescription" defaultValue={product.shortDescription}
                        className="bg-background border-input" />
                    <p className="text-xs text-muted-foreground">Usada como pitch rápido nas landing pages e pelo agente IA.</p>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="fullDescription" className="text-sm font-medium">Descrição Completa</Label>
                    <Textarea id="fullDescription" name="fullDescription" defaultValue={product.fullDescription}
                        rows={6} className="bg-background border-input" />
                    <p className="text-xs text-muted-foreground">Descrição detalhada para o agente IA. Quanto mais rica, melhor o atendimento.</p>
                </div>
            </fieldset>

            {/* Preço */}
            <fieldset className="space-y-4 rounded-md border border-border p-4">
                <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Precificação
                </legend>
                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="price" className="text-sm font-medium">Preço</Label>
                        <Input id="price" name="price" type="number" step="0.01" min="0"
                            defaultValue={product.price ?? ''}
                            className="bg-background border-input" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="priceType" className="text-sm font-medium">Tipo</Label>
                        <Select name="priceType" defaultValue={product.priceType ?? ''}>
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
                    <div className="space-y-1.5">
                        <Label htmlFor="currency" className="text-sm font-medium">Moeda</Label>
                        <Input id="currency" name="currency" defaultValue={product.currency}
                            maxLength={3} className="bg-background border-input" />
                    </div>
                </div>
            </fieldset>

            {/* Features */}
            <fieldset className="space-y-4 rounded-md border border-border p-4">
                <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Funcionalidades / Características
                </legend>
                <p className="text-xs text-muted-foreground">O que o produto oferece. Usado nas landing pages e pelo agente IA.</p>
                {features.map((feature, i) => (
                    <div key={i} className="flex gap-2 items-start">
                        <div className="flex-1 space-y-1">
                            <Input
                                placeholder="Título"
                                value={feature.title}
                                onChange={e => {
                                    const updated = [...features]
                                    updated[i] = { ...updated[i], title: e.target.value }
                                    setFeatures(updated)
                                }}
                                className="bg-background border-input text-sm"
                            />
                            <Input
                                placeholder="Descrição"
                                value={feature.description}
                                onChange={e => {
                                    const updated = [...features]
                                    updated[i] = { ...updated[i], description: e.target.value }
                                    setFeatures(updated)
                                }}
                                className="bg-background border-input text-sm"
                            />
                        </div>
                        <button type="button" onClick={() => setFeatures(features.filter((_, j) => j !== i))}
                            className="text-muted-foreground hover:text-destructive transition-colors mt-2">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm"
                    onClick={() => setFeatures([...features, { title: '', description: '' }])}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                </Button>
            </fieldset>

            {/* Benefits */}
            <fieldset className="space-y-4 rounded-md border border-border p-4">
                <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Benefícios
                </legend>
                <p className="text-xs text-muted-foreground">Resultados que o cliente obtém. Usado para convencer nas landing pages.</p>
                {benefits.map((benefit, i) => (
                    <div key={i} className="flex gap-2 items-start">
                        <div className="flex-1 space-y-1">
                            <Input
                                placeholder="Título"
                                value={benefit.title}
                                onChange={e => {
                                    const updated = [...benefits]
                                    updated[i] = { ...updated[i], title: e.target.value }
                                    setBenefits(updated)
                                }}
                                className="bg-background border-input text-sm"
                            />
                            <Input
                                placeholder="Descrição"
                                value={benefit.description}
                                onChange={e => {
                                    const updated = [...benefits]
                                    updated[i] = { ...updated[i], description: e.target.value }
                                    setBenefits(updated)
                                }}
                                className="bg-background border-input text-sm"
                            />
                        </div>
                        <button type="button" onClick={() => setBenefits(benefits.filter((_, j) => j !== i))}
                            className="text-muted-foreground hover:text-destructive transition-colors mt-2">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm"
                    onClick={() => setBenefits([...benefits, { title: '', description: '' }])}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                </Button>
            </fieldset>

            {/* FAQs */}
            <fieldset className="space-y-4 rounded-md border border-border p-4">
                <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Perguntas Frequentes (FAQ)
                </legend>
                <p className="text-xs text-muted-foreground">Perguntas comuns sobre o produto. O agente IA usará para responder visitantes.</p>
                {faqs.map((faq, i) => (
                    <div key={i} className="flex gap-2 items-start">
                        <div className="flex-1 space-y-1">
                            <Input
                                placeholder="Pergunta"
                                value={faq.question}
                                onChange={e => {
                                    const updated = [...faqs]
                                    updated[i] = { ...updated[i], question: e.target.value }
                                    setFaqs(updated)
                                }}
                                className="bg-background border-input text-sm"
                            />
                            <Textarea
                                placeholder="Resposta"
                                value={faq.answer}
                                rows={2}
                                onChange={e => {
                                    const updated = [...faqs]
                                    updated[i] = { ...updated[i], answer: e.target.value }
                                    setFaqs(updated)
                                }}
                                className="bg-background border-input text-sm"
                            />
                        </div>
                        <button type="button" onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}
                            className="text-muted-foreground hover:text-destructive transition-colors mt-2">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm"
                    onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                </Button>
            </fieldset>

            {/* Público & Diferenciais */}
            <fieldset className="space-y-4 rounded-md border border-border p-4">
                <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Público e Diferenciais
                </legend>
                <div className="space-y-1.5">
                    <Label htmlFor="targetAudience" className="text-sm font-medium">Público-alvo</Label>
                    <Textarea id="targetAudience" name="targetAudience" defaultValue={product.targetAudience}
                        rows={3} className="bg-background border-input" />
                    <p className="text-xs text-muted-foreground">Descreva o perfil do cliente ideal. O agente IA usará para qualificar leads.</p>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="differentials" className="text-sm font-medium">Diferenciais</Label>
                    <Textarea id="differentials" name="differentials" defaultValue={product.differentials}
                        rows={3} className="bg-background border-input" />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="tags" className="text-sm font-medium">Tags</Label>
                    <Input id="tags" name="tags" defaultValue={product.tags.join(', ')}
                        placeholder="marketing, digital, curso"
                        className="bg-background border-input" />
                </div>
            </fieldset>

            {state.error && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-(--radius) px-3 py-2">
                    {state.error}
                </p>
            )}
            {state.success && (
                <p className="text-sm text-[hsl(var(--success))] bg-[hsl(var(--success-subtle))] border border-[hsl(var(--success))]/20 rounded-(--radius) px-3 py-2">
                    Produto atualizado com sucesso!
                </p>
            )}

            <Button type="submit" disabled={isPending} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
        </form>
    )
}

'use client'

import { useActionState, useState } from 'react'
import { updateProduct } from '@/actions/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { InlineError } from '@/components/ui/inline-error'
import { InlineNotice } from '@/components/ui/inline-notice'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Save, Plus, X, Package, FileText, DollarSign, Sparkles, Star, HelpCircle, Target, Loader2, CheckCircle2 } from 'lucide-react'
import type { ProductFeature, ProductBenefit, ProductFaq } from '@/domain/entities'

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
    return (
        <div className="flex items-start gap-2.5 pb-3 border-b border-border-subtle">
            <div className="w-7 h-7 rounded-md bg-[hsl(var(--primary-subtle))] flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
                {description && <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
            </div>
        </div>
    )
}

function DynamicListItem({ index, onRemove, children }: { index: number; onRemove: () => void; children: React.ReactNode }) {
    return (
        <div className="group relative flex gap-3 items-start bg-background rounded-lg border border-border-subtle p-3 transition-all duration-200 hover:border-border">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent text-[10px] font-bold text-muted-foreground mt-0.5 tabular-nums">
                {index + 1}
            </span>
            <div className="flex-1 space-y-2">
                {children}
            </div>
            <button
                type="button"
                onClick={onRemove}
                className="text-muted-foreground/40 hover:text-destructive transition-colors mt-0.5 opacity-0 group-hover:opacity-100"
                aria-label="Remover item"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}

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
        <form action={action} className="space-y-8">
            {/* Hidden JSON fields */}
            <input type="hidden" name="featuresJson" value={JSON.stringify(features)} />
            <input type="hidden" name="benefitsJson" value={JSON.stringify(benefits)} />
            <input type="hidden" name="faqsJson" value={JSON.stringify(faqs)} />

            {/* Informações básicas */}
            <div className="space-y-4">
                <SectionHeader icon={Package} title="Informações Básicas" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs font-semibold text-foreground">Nome</Label>
                        <Input id="name" name="name" defaultValue={product.name}
                            className="bg-background border-input h-9" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="slug" className="text-xs font-semibold text-foreground">Slug</Label>
                        <Input id="slug" name="slug" defaultValue={product.slug}
                            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                            className="bg-background border-input h-9 font-mono text-xs" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="type" className="text-xs font-semibold text-foreground">Tipo</Label>
                    <Select name="type" defaultValue={product.type}>
                        <SelectTrigger className="bg-background border-input h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="product">Produto Digital</SelectItem>
                            <SelectItem value="service">Serviço Digital</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Descrições */}
            <div className="space-y-4">
                <SectionHeader icon={FileText} title="Descrição" description="Textos usados nas landing pages e como contexto para o agente IA." />
                <div className="space-y-1.5">
                    <Label htmlFor="shortDescription" className="text-xs font-semibold text-foreground">Descrição Curta</Label>
                    <Input id="shortDescription" name="shortDescription" defaultValue={product.shortDescription}
                        className="bg-background border-input h-9" />
                    <p className="text-[11px] text-muted-foreground">Usada como pitch rápido nas landing pages e pelo agente IA.</p>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="fullDescription" className="text-xs font-semibold text-foreground">Descrição Completa</Label>
                    <Textarea id="fullDescription" name="fullDescription" defaultValue={product.fullDescription}
                        rows={6} className="bg-background border-input text-sm" />
                    <p className="text-[11px] text-muted-foreground">Quanto mais rica, melhor o atendimento do agente IA e a qualidade das landing pages.</p>
                </div>
            </div>

            {/* Preço */}
            <div className="space-y-4">
                <SectionHeader icon={DollarSign} title="Precificação" />
                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="price" className="text-xs font-semibold text-foreground">Preço</Label>
                        <Input id="price" name="price" type="number" step="0.01" min="0"
                            defaultValue={product.price ?? ''}
                            className="bg-background border-input h-9 font-mono" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="priceType" className="text-xs font-semibold text-foreground">Tipo</Label>
                        <Select name="priceType" defaultValue={product.priceType ?? ''}>
                            <SelectTrigger className="bg-background border-input h-9">
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
                        <Label htmlFor="currency" className="text-xs font-semibold text-foreground">Moeda</Label>
                        <Input id="currency" name="currency" defaultValue={product.currency}
                            maxLength={3} className="bg-background border-input h-9 uppercase font-mono text-xs" />
                    </div>
                </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
                <SectionHeader icon={Sparkles} title="Funcionalidades / Características" description="O que o produto oferece. Alimenta landing pages e agente IA." />
                <div className="space-y-3">
                    {features.map((feature, i) => (
                        <DynamicListItem key={i} index={i} onRemove={() => setFeatures(features.filter((_, j) => j !== i))}>
                            <Input
                                placeholder="Título da funcionalidade"
                                value={feature.title}
                                onChange={e => {
                                    const updated = [...features]
                                    updated[i] = { ...updated[i], title: e.target.value }
                                    setFeatures(updated)
                                }}
                                className="bg-card border-input h-8 text-sm font-medium"
                            />
                            <Input
                                placeholder="Descrição breve (opcional)"
                                value={feature.description}
                                onChange={e => {
                                    const updated = [...features]
                                    updated[i] = { ...updated[i], description: e.target.value }
                                    setFeatures(updated)
                                }}
                                className="bg-card border-input h-8 text-xs text-muted-foreground"
                            />
                        </DynamicListItem>
                    ))}
                </div>
                <Button type="button" variant="outline" size="sm"
                    className="h-8 text-xs transition-all duration-200"
                    onClick={() => setFeatures([...features, { title: '', description: '' }])}>
                    <Plus className="w-3 h-3 mr-1.5" /> Adicionar funcionalidade
                </Button>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
                <SectionHeader icon={Star} title="Benefícios" description="Resultados que o cliente obtém. Usado para convencer nas landing pages." />
                <div className="space-y-3">
                    {benefits.map((benefit, i) => (
                        <DynamicListItem key={i} index={i} onRemove={() => setBenefits(benefits.filter((_, j) => j !== i))}>
                            <Input
                                placeholder="Título do benefício"
                                value={benefit.title}
                                onChange={e => {
                                    const updated = [...benefits]
                                    updated[i] = { ...updated[i], title: e.target.value }
                                    setBenefits(updated)
                                }}
                                className="bg-card border-input h-8 text-sm font-medium"
                            />
                            <Input
                                placeholder="Descrição breve (opcional)"
                                value={benefit.description}
                                onChange={e => {
                                    const updated = [...benefits]
                                    updated[i] = { ...updated[i], description: e.target.value }
                                    setBenefits(updated)
                                }}
                                className="bg-card border-input h-8 text-xs text-muted-foreground"
                            />
                        </DynamicListItem>
                    ))}
                </div>
                <Button type="button" variant="outline" size="sm"
                    className="h-8 text-xs transition-all duration-200"
                    onClick={() => setBenefits([...benefits, { title: '', description: '' }])}>
                    <Plus className="w-3 h-3 mr-1.5" /> Adicionar benefício
                </Button>
            </div>

            {/* FAQs */}
            <div className="space-y-4">
                <SectionHeader icon={HelpCircle} title="Perguntas Frequentes (FAQ)" description="O agente IA usará estas respostas para atender visitantes." />
                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <DynamicListItem key={i} index={i} onRemove={() => setFaqs(faqs.filter((_, j) => j !== i))}>
                            <Input
                                placeholder="Pergunta"
                                value={faq.question}
                                onChange={e => {
                                    const updated = [...faqs]
                                    updated[i] = { ...updated[i], question: e.target.value }
                                    setFaqs(updated)
                                }}
                                className="bg-card border-input h-8 text-sm font-medium"
                            />
                            <Textarea
                                placeholder="Resposta detalhada"
                                value={faq.answer}
                                rows={2}
                                onChange={e => {
                                    const updated = [...faqs]
                                    updated[i] = { ...updated[i], answer: e.target.value }
                                    setFaqs(updated)
                                }}
                                className="bg-card border-input text-xs"
                            />
                        </DynamicListItem>
                    ))}
                </div>
                <Button type="button" variant="outline" size="sm"
                    className="h-8 text-xs transition-all duration-200"
                    onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}>
                    <Plus className="w-3 h-3 mr-1.5" /> Adicionar pergunta
                </Button>
            </div>

            {/* Público & Diferenciais */}
            <div className="space-y-4">
                <SectionHeader icon={Target} title="Público e Diferenciais" description="Contexto para o agente IA qualificar leads e montar argumentos de venda." />
                <div className="space-y-1.5">
                    <Label htmlFor="targetAudience" className="text-xs font-semibold text-foreground">Público-alvo</Label>
                    <Textarea id="targetAudience" name="targetAudience" defaultValue={product.targetAudience}
                        rows={3} className="bg-background border-input text-sm" />
                    <p className="text-[11px] text-muted-foreground">Descreva o perfil do cliente ideal. O agente IA usará para qualificar leads.</p>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="differentials" className="text-xs font-semibold text-foreground">Diferenciais</Label>
                    <Textarea id="differentials" name="differentials" defaultValue={product.differentials}
                        rows={3} className="bg-background border-input text-sm" />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="tags" className="text-xs font-semibold text-foreground">Tags</Label>
                    <Input id="tags" name="tags" defaultValue={product.tags.join(', ')}
                        placeholder="marketing, digital, curso"
                        className="bg-background border-input h-9" />
                    <p className="text-[11px] text-muted-foreground">Separadas por vírgula. Usadas para filtros e organização.</p>
                </div>
            </div>

            {/* Feedback */}
            {state.error && (
                <InlineError message={state.error} />
            )}
            {state.success && (
                <InlineNotice variant="success" message="Produto atualizado com sucesso!" />
            )}

            <Button type="submit" disabled={isPending} className="w-full h-10">
                {isPending ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                    </>
                ) : (
                    <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Alterações
                    </>
                )}
            </Button>
        </form>
    )
}

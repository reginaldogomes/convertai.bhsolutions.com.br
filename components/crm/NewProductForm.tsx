'use client'

import { useActionState, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createProduct } from '@/actions/products'
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
import {
    Package, FileText, DollarSign, Target, Sparkles, Star, HelpCircle, Tag,
    Plus, X, Save, Loader2, Bot, Wand2, CheckCircle2, ArrowLeft,
} from 'lucide-react'
import type { ProductFeature, ProductBenefit, ProductFaq } from '@/domain/entities'

/* ─── Helpers ─── */

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
            <div className="flex-1 space-y-2">{children}</div>
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

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
}

/* ─── Main Component ─── */

export function NewProductForm() {
    const router = useRouter()

    // Form state
    const [name, setName] = useState('')
    const [slug, setSlug] = useState('')
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
    const [type, setType] = useState<'product' | 'service'>('product')
    const [shortDescription, setShortDescription] = useState('')
    const [fullDescription, setFullDescription] = useState('')
    const [price, setPrice] = useState('')
    const [priceType, setPriceType] = useState('')
    const [currency, setCurrency] = useState('BRL')
    const [targetAudience, setTargetAudience] = useState('')
    const [differentials, setDifferentials] = useState('')
    const [tags, setTags] = useState('')
    const [features, setFeatures] = useState<ProductFeature[]>([])
    const [benefits, setBenefits] = useState<ProductBenefit[]>([])
    const [faqs, setFaqs] = useState<ProductFaq[]>([])

    // AI state
    const [aiContext, setAiContext] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [aiError, setAiError] = useState('')
    const [aiGenerated, setAiGenerated] = useState(false)
    const lastGenerationSignatureRef = useRef<string | null>(null)

    // Server action
    const wrappedAction = async (prevState: { error: string; success: boolean }, formData: FormData) => {
        const result = await createProduct(prevState, formData)
        if (result.success) router.push('/products')
        return result
    }
    const [state, action, isPending] = useActionState(wrappedAction, { error: '', success: false })

    // Auto-slug from name
    const handleNameChange = useCallback((value: string) => {
        setName(value)
        if (!slugManuallyEdited) {
            setSlug(slugify(value))
        }
    }, [slugManuallyEdited])

    const handleSlugChange = useCallback((value: string) => {
        setSlug(value)
        setSlugManuallyEdited(true)
    }, [])

    // AI Generation
    const handleGenerate = useCallback(async () => {
        if (!name.trim()) {
            setAiError('Informe o nome do produto antes de gerar com IA.')
            return
        }

        const generationSignature = JSON.stringify({
            name: name.trim().toLowerCase(),
            type,
            context: aiContext.trim(),
        })

        if (aiGenerated && generationSignature === lastGenerationSignatureRef.current) {
            return
        }

        setIsGenerating(true)
        setAiError('')
        setAiGenerated(false)

        try {
            const res = await fetch('/api/products/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), type, context: aiContext.trim() || undefined }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || `Erro ${res.status}`)
            }

            const data = await res.json()

            // Fill form with AI data
            setShortDescription(data.shortDescription || '')
            setFullDescription(data.fullDescription || '')
            setTargetAudience(data.targetAudience || '')
            setDifferentials(data.differentials || '')
            setFeatures(data.features || [])
            setBenefits(data.benefits || [])
            setFaqs(data.faqs || [])
            setTags((data.tags || []).join(', '))
            if (data.suggestedSlug && !slugManuallyEdited) {
                setSlug(data.suggestedSlug)
            }
            lastGenerationSignatureRef.current = generationSignature
            setAiGenerated(true)
        } catch (err) {
            setAiError(err instanceof Error ? err.message : 'Erro ao gerar conteúdo com IA')
        } finally {
            setIsGenerating(false)
        }
    }, [name, type, aiContext, slugManuallyEdited, aiGenerated])

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main form — Left 2 cols */}
            <div className="lg:col-span-2 space-y-6">
                {/* AI Generation Card */}
                <div className="bg-card border border-border rounded-(--radius) overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-linear-to-r from-[hsl(var(--primary-subtle))] to-accent/30">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Bot className="w-4.5 h-4.5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-foreground">Assistente IA</h2>
                                <p className="text-[11px] text-muted-foreground">Preencha o nome e tipo, depois gere todo o conteúdo com um clique.</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        {/* Step 1: Name + Type */}
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="ai-name" className="text-xs font-semibold text-foreground">
                                    Nome do Produto / Serviço <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="ai-name"
                                    value={name}
                                    onChange={e => handleNameChange(e.target.value)}
                                    placeholder="Ex: Curso Completo de Marketing Digital"
                                    className="bg-background border-input h-10 text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">Tipo</Label>
                                <Select value={type} onValueChange={(v: 'product' | 'service') => setType(v)}>
                                    <SelectTrigger className="bg-background border-input h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="product">Produto Digital</SelectItem>
                                        <SelectItem value="service">Serviço Digital</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Step 2: Optional context */}
                        <div className="space-y-1.5">
                            <Label htmlFor="ai-context" className="text-xs font-semibold text-foreground">
                                Contexto adicional <span className="text-muted-foreground font-normal">(opcional)</span>
                            </Label>
                            <Textarea
                                id="ai-context"
                                value={aiContext}
                                onChange={e => setAiContext(e.target.value)}
                                placeholder="Descreva brevemente o produto, público-alvo, faixa de preço... Quanto mais contexto, melhor o resultado."
                                rows={3}
                                className="bg-background border-input text-sm"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                A IA usará essas informações para gerar descrições, features, benefícios, FAQs e tags.
                            </p>
                        </div>

                        {/* Generate button */}
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                onClick={handleGenerate}
                                disabled={isGenerating || !name.trim()}
                                className="h-10 px-5"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Gerando conteúdo...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-4 h-4 mr-2" />
                                        Gerar com IA
                                    </>
                                )}
                            </Button>
                            {aiGenerated && (
                                <span className="flex items-center gap-1.5 text-xs text-[hsl(var(--success))] font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Conteúdo gerado! Revise e ajuste abaixo.
                                </span>
                            )}
                        </div>

                        {aiError && (
                            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-(--radius) px-3 py-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                                {aiError}
                            </div>
                        )}
                    </div>
                </div>

                {/* Product Form Card */}
                <div className="bg-card border border-border rounded-(--radius) overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-accent/30">
                        <h2 className="text-sm font-bold text-foreground">Dados do Produto</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Revise e complete os campos. Dados ricos melhoram landing pages, campanhas e o chatbot IA.</p>
                    </div>
                    <form action={action} className="p-6 space-y-8">
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
                                    <Input
                                        id="name" name="name"
                                        value={name}
                                        onChange={e => handleNameChange(e.target.value)}
                                        required
                                        className="bg-background border-input h-9"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="slug" className="text-xs font-semibold text-foreground">Slug (URL)</Label>
                                    <Input
                                        id="slug" name="slug"
                                        value={slug}
                                        onChange={e => handleSlugChange(e.target.value)}
                                        required
                                        pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                                        title="Apenas letras minúsculas, números e hifens"
                                        className="bg-background border-input h-9 font-mono text-xs"
                                    />
                                    <p className="text-[11px] text-muted-foreground">Auto-gerado a partir do nome. Edite para personalizar.</p>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">Tipo</Label>
                                <input type="hidden" name="type" value={type} />
                                <Select value={type} onValueChange={(v: 'product' | 'service') => setType(v)}>
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
                                <Input
                                    id="shortDescription" name="shortDescription"
                                    value={shortDescription}
                                    onChange={e => setShortDescription(e.target.value)}
                                    placeholder="Uma frase que resume o produto..."
                                    className="bg-background border-input h-9"
                                />
                                <p className="text-[11px] text-muted-foreground">Usada como headline nas landing pages e pelo agente IA.</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="fullDescription" className="text-xs font-semibold text-foreground">Descrição Completa</Label>
                                <Textarea
                                    id="fullDescription" name="fullDescription"
                                    value={fullDescription}
                                    onChange={e => setFullDescription(e.target.value)}
                                    placeholder="Descreva em detalhes o que é o produto, para quem é, e como funciona..."
                                    rows={8}
                                    className="bg-background border-input text-sm"
                                />
                                <p className="text-[11px] text-muted-foreground">Quanto mais detalhada, melhor o chatbot IA atende os visitantes. Alimenta o RAG.</p>
                            </div>
                        </div>

                        {/* Preço */}
                        <div className="space-y-4">
                            <SectionHeader icon={DollarSign} title="Precificação" />
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="price" className="text-xs font-semibold text-foreground">Preço</Label>
                                    <Input
                                        id="price" name="price" type="number" step="0.01" min="0"
                                        value={price}
                                        onChange={e => setPrice(e.target.value)}
                                        placeholder="197.00"
                                        className="bg-background border-input h-9 font-mono"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">Tipo</Label>
                                    <input type="hidden" name="priceType" value={priceType} />
                                    <Select value={priceType} onValueChange={setPriceType}>
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
                                    <Input
                                        id="currency" name="currency"
                                        value={currency}
                                        onChange={e => setCurrency(e.target.value)}
                                        maxLength={3}
                                        className="bg-background border-input h-9 uppercase font-mono text-xs"
                                    />
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
                                className="h-8 text-xs"
                                onClick={() => setFeatures([...features, { title: '', description: '' }])}>
                                <Plus className="w-3 h-3 mr-1.5" /> Adicionar funcionalidade
                            </Button>
                        </div>

                        {/* Benefits */}
                        <div className="space-y-4">
                            <SectionHeader icon={Star} title="Benefícios" description="Resultados concretos que o cliente obtém. Usado nas landing pages." />
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
                                className="h-8 text-xs"
                                onClick={() => setBenefits([...benefits, { title: '', description: '' }])}>
                                <Plus className="w-3 h-3 mr-1.5" /> Adicionar benefício
                            </Button>
                        </div>

                        {/* FAQs */}
                        <div className="space-y-4">
                            <SectionHeader icon={HelpCircle} title="Perguntas Frequentes (FAQ)" description="O agente IA usará estas respostas para atender visitantes automaticamente." />
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
                                className="h-8 text-xs"
                                onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}>
                                <Plus className="w-3 h-3 mr-1.5" /> Adicionar pergunta
                            </Button>
                        </div>

                        {/* Público & Diferenciais */}
                        <div className="space-y-4">
                            <SectionHeader icon={Target} title="Público e Diferenciais" description="Contexto para o agente IA qualificar leads e montar argumentos de venda." />
                            <div className="space-y-1.5">
                                <Label htmlFor="targetAudience" className="text-xs font-semibold text-foreground">Público-alvo</Label>
                                <Textarea
                                    id="targetAudience" name="targetAudience"
                                    value={targetAudience}
                                    onChange={e => setTargetAudience(e.target.value)}
                                    placeholder="Descreva o perfil do cliente ideal deste produto..."
                                    rows={3}
                                    className="bg-background border-input text-sm"
                                />
                                <p className="text-[11px] text-muted-foreground">O agente IA usará para qualificar leads e personalizar atendimento.</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="differentials" className="text-xs font-semibold text-foreground">Diferenciais</Label>
                                <Textarea
                                    id="differentials" name="differentials"
                                    value={differentials}
                                    onChange={e => setDifferentials(e.target.value)}
                                    placeholder="O que torna este produto único no mercado..."
                                    rows={3}
                                    className="bg-background border-input text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="tags" className="text-xs font-semibold text-foreground">Tags</Label>
                                <Input
                                    id="tags" name="tags"
                                    value={tags}
                                    onChange={e => setTags(e.target.value)}
                                    placeholder="marketing, digital, curso (separados por vírgula)"
                                    className="bg-background border-input h-9"
                                />
                                <p className="text-[11px] text-muted-foreground">Separadas por vírgula. Usadas para filtros, SEO e categorização.</p>
                            </div>
                        </div>

                        {/* Form feedback */}
                        {state.error && (
                            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-(--radius) px-4 py-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                                {state.error}
                            </div>
                        )}

                        {/* Submit */}
                        <div className="flex items-center gap-3 pt-2">
                            <Button type="submit" disabled={isPending} className="h-10 px-8">
                                {isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Criando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Criar Produto
                                    </>
                                )}
                            </Button>
                            <Button type="button" variant="ghost" asChild className="h-10">
                                <Link href="/products">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Voltar
                                </Link>
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Sidebar — Right col */}
            <div className="space-y-5">
                {/* AI Score Preview */}
                <div className="bg-card border border-border rounded-(--radius) overflow-hidden sticky top-6">
                    <div className="px-5 py-3.5 border-b border-border bg-accent/30">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Bot className="w-3.5 h-3.5" /> Qualidade do Conteúdo
                        </h2>
                    </div>
                    <div className="p-5">
                        <ContentScoreBar
                            name={name}
                            shortDescription={shortDescription}
                            fullDescription={fullDescription}
                            features={features}
                            benefits={benefits}
                            faqs={faqs}
                            targetAudience={targetAudience}
                            differentials={differentials}
                            tags={tags}
                        />
                    </div>
                </div>

                {/* Tips */}
                <div className="bg-card border border-border rounded-(--radius) overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-border bg-accent/30">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dicas</h2>
                    </div>
                    <div className="p-5 space-y-3">
                        {[
                            { icon: Bot, text: 'Descrições detalhadas melhoram as respostas do chatbot IA' },
                            { icon: Sparkles, text: 'Features e benefícios são usados nas seções das landing pages' },
                            { icon: HelpCircle, text: 'FAQs treinam o agente IA para responder dúvidas automaticamente' },
                            { icon: Target, text: 'O público-alvo ajuda o agente IA a qualificar leads' },
                            { icon: Tag, text: 'Tags ajudam na organização e SEO das landing pages' },
                        ].map(({ icon: Icon, text }, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <Icon className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                <p className="text-[11px] text-muted-foreground leading-relaxed">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ─── Content Score Widget ─── */

function ContentScoreBar({
    name, shortDescription, fullDescription, features, benefits, faqs, targetAudience, differentials, tags,
}: {
    name: string
    shortDescription: string
    fullDescription: string
    features: ProductFeature[]
    benefits: ProductBenefit[]
    faqs: ProductFaq[]
    targetAudience: string
    differentials: string
    tags: string
}) {
    const checks = [
        { label: 'Nome', icon: Package, filled: name.trim().length > 0 },
        { label: 'Descrição curta', icon: FileText, filled: shortDescription.trim().length > 0 },
        { label: 'Descrição completa', icon: FileText, filled: fullDescription.trim().length > 20 },
        { label: 'Funcionalidades', icon: Sparkles, filled: features.length > 0 && features.some(f => f.title.trim()) },
        { label: 'Benefícios', icon: Star, filled: benefits.length > 0 && benefits.some(b => b.title.trim()) },
        { label: 'FAQs', icon: HelpCircle, filled: faqs.length > 0 && faqs.some(f => f.question.trim()) },
        { label: 'Público-alvo', icon: Target, filled: targetAudience.trim().length > 0 },
        { label: 'Diferenciais', icon: Target, filled: differentials.trim().length > 0 },
        { label: 'Tags', icon: Tag, filled: tags.trim().length > 0 },
    ]

    const filledCount = checks.filter(c => c.filled).length
    const percent = Math.round((filledCount / checks.length) * 100)

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{filledCount} de {checks.length} campos</span>
                <span className={`text-sm font-bold ${percent === 100 ? 'text-[hsl(var(--success))]' : percent >= 50 ? 'text-[hsl(var(--warning))]' : 'text-destructive'}`}>
                    {percent}%
                </span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-4">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${percent === 100 ? 'bg-[hsl(var(--success))]' : percent >= 50 ? 'bg-[hsl(var(--warning))]' : 'bg-destructive'}`}
                    style={{ width: `${percent}%` }}
                />
            </div>
            <div className="space-y-2">
                {checks.map(({ label, icon: Icon, filled }) => (
                    <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${filled ? 'bg-[hsl(var(--primary-subtle))]' : 'bg-secondary'}`}>
                                <Icon className={`w-3 h-3 ${filled ? 'text-primary' : 'text-muted-foreground/50'}`} />
                            </div>
                            <span className="text-xs text-muted-foreground">{label}</span>
                        </div>
                        {filled ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--success))]" />
                        ) : (
                            <span className="w-3.5 h-3.5 rounded-full border border-border-subtle" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

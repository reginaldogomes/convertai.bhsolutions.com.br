'use client'

import { useActionState, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createLandingPage } from '@/actions/landing-pages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { InlineError } from '@/components/ui/inline-error'
import { InlineNotice } from '@/components/ui/inline-notice'
import {
    Globe, Package, Sparkles, Bot, Wand2, CheckCircle2, Loader2, Save,
    Check, Palette, FileText, MessageSquare, Zap, LayoutTemplate,
} from 'lucide-react'
import { HeroTemplatePicker } from '@/components/crm/HeroTemplatePicker'
import type { HeroLayoutPreset } from '@/components/crm/HeroTemplatePicker'
import { DESIGN_PRESETS, DEFAULT_DESIGN_SYSTEM } from '@/domain/value-objects/design-system'
import type { DesignSystem } from '@/domain/value-objects/design-system'
import { IMAGE_MODELS, type ImageModelId } from '@/lib/ai'
import type { ProductFeature, ProductBenefit, ProductFaq } from '@/domain/entities'
import { useGenerateSections } from '@/hooks/useGenerateSections'

/* ─── Types ─── */

interface ProductOption {
    id: string
    name: string
    slug: string
    type: 'product' | 'service'
    shortDescription: string
    fullDescription: string
    targetAudience: string
    differentials: string
    features: ProductFeature[]
    benefits: ProductBenefit[]
    faqs: ProductFaq[]
    price: string
}

interface NewLandingPageFormProps {
    products: ProductOption[]
}

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

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
}

function buildProductContext(product: ProductOption): string {
    const lines: string[] = [
        `## ${product.name}`,
        `Tipo: ${product.type === 'service' ? 'Serviço Digital' : 'Produto Digital'}`,
        '',
        `### Descrição`,
        product.fullDescription || product.shortDescription,
    ]
    if (product.price && product.price !== 'Sob consulta') {
        lines.push('', `### Preço`, product.price)
    }
    if (product.features.length > 0) {
        lines.push('', `### Funcionalidades`)
        product.features.forEach(f => lines.push(`- **${f.title}**: ${f.description}`))
    }
    if (product.benefits.length > 0) {
        lines.push('', `### Benefícios`)
        product.benefits.forEach(b => lines.push(`- **${b.title}**: ${b.description}`))
    }
    if (product.targetAudience) {
        lines.push('', `### Público-alvo`, product.targetAudience)
    }
    if (product.differentials) {
        lines.push('', `### Diferenciais`, product.differentials)
    }
    if (product.faqs.length > 0) {
        lines.push('', `### Perguntas Frequentes`)
        product.faqs.forEach(f => lines.push(`**P: ${f.question}**`, `R: ${f.answer}`, ''))
    }
    return lines.join('\n')
}

function buildFastCtaText(name: string): string {
    const trimmed = name.trim()
    if (!trimmed) return 'Falar com especialista'
    return `Quero conhecer ${trimmed}`
}

function isSameDesignSystem(a: DesignSystem, b: DesignSystem): boolean {
    return JSON.stringify(a) === JSON.stringify(b)
}

/* ─── Main Component ─── */

export function NewLandingPageForm({ products }: NewLandingPageFormProps) {
    const router = useRouter()

    // Product selection
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
    const selectedProduct = products.find(p => p.id === selectedProductId) ?? null

    // Form state
    const [name, setName] = useState('')
    const [slug, setSlug] = useState('')
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
    const [headline, setHeadline] = useState('')
    const [subheadline, setSubheadline] = useState('')
    const [ctaText, setCtaText] = useState('')
    const [ctaManuallyEdited, setCtaManuallyEdited] = useState(false)
    const [chatbotName, setChatbotName] = useState('')
    const [chatbotWelcomeMessage, setChatbotWelcomeMessage] = useState('')
    const [chatbotSystemPrompt, setChatbotSystemPrompt] = useState('')
    const [heroLayoutPreset, setHeroLayoutPreset] = useState<HeroLayoutPreset>('central')
    const [designSystem, setDesignSystem] = useState<DesignSystem>(DEFAULT_DESIGN_SYSTEM)
    const [pendingDesignSystem, setPendingDesignSystem] = useState<DesignSystem | null>(null)
    const [designSystemAlert, setDesignSystemAlert] = useState('')
    const [generateVisuals, setGenerateVisuals] = useState(false)
    const [imageModel, setImageModel] = useState<ImageModelId>('gemini-2.5-flash-image')

    const [aiPrompt, setAiPrompt] = useState('')
    const { state: generation, reset: resetGeneration, generateSections, isGenerating, hasValidSections } = useGenerateSections()

    // Server action
    const wrappedAction = async (prevState: { error: string; success: boolean }, formData: FormData) => {
        const result = await createLandingPage(prevState, formData)
        if (result.success) router.push('/landing-pages')
        return result
    }
    const [state, action, isPending] = useActionState(wrappedAction, { error: '', success: false })

    // Auto-slug from name
    const handleNameChange = useCallback((value: string) => {
        setName(value)
        if (!slugManuallyEdited) setSlug(slugify(value))
    }, [slugManuallyEdited])

    const handleSlugChange = useCallback((value: string) => {
        setSlug(value)
        setSlugManuallyEdited(true)
    }, [])

    const buildPromptFromProduct = useCallback((product: ProductOption) => (
        `${product.name} — ${product.shortDescription}. ` +
        (product.targetAudience ? `Público-alvo: ${product.targetAudience}. ` : '') +
        (product.differentials ? `Diferenciais: ${product.differentials}` : '')
    ), [])

    // Product selection handler — auto-fills fields and resets generation state.
    const handleProductSelect = useCallback((productId: string | null) => {
        setSelectedProductId(productId)
        resetGeneration()
        if (!productId) {
            setAiPrompt('')
            return
        }

        const product = products.find(p => p.id === productId)
        if (product) {
            const productName = product.name
            if (!name) handleNameChange(productName)
            setHeadline(productName)
            setSubheadline(product.shortDescription)
            if (!ctaManuallyEdited) {
                setCtaText(buildFastCtaText(productName))
            }
            setChatbotName(productName)
            setChatbotWelcomeMessage(`Olá! Sou o assistente do ${productName}. Como posso ajudar?`)

            const context = buildProductContext(product)
            setChatbotSystemPrompt(
                `Você é um assistente especializado no produto/serviço "${productName}". ` +
                `Use APENAS as informações abaixo para responder. Seja cordial, objetivo e persuasivo.\n\n${context}`
            )

            setAiPrompt(buildPromptFromProduct(product))
        }
    }, [products, name, handleNameChange, resetGeneration, buildPromptFromProduct, ctaManuallyEdited])

    const generateFromCurrentContext = useCallback(async (forcedPrompt?: string) => {
        const prompt = forcedPrompt?.trim() || aiPrompt.trim() || (selectedProduct
            ? buildPromptFromProduct(selectedProduct)
            : '')

        if (prompt.length < 10) {
            return
        }

        if (!ctaManuallyEdited && !ctaText.trim()) {
            setCtaText(buildFastCtaText(name || selectedProduct?.name || ''))
        }

        const generationResult = await generateSections({
            prompt,
            pageContext: {
                name: name || selectedProduct?.name || undefined,
                headline: headline || selectedProduct?.name || undefined,
                subheadline: subheadline || selectedProduct?.shortDescription || undefined,
            },
            productContext: selectedProduct ? buildProductContext(selectedProduct) : undefined,
            productId: selectedProduct?.id,
            imageGeneration: {
                enabled: generateVisuals,
                model: imageModel,
            },
        })

        if (generationResult) {
            if (generationResult.generatedDesignSystem) {
                setDesignSystem(generationResult.generatedDesignSystem)
                setPendingDesignSystem(null)
                setDesignSystemAlert('Tema sugerido pela IA aplicado automaticamente.')
            }

            const heroSection = generationResult.sections.find((section) => section.type === 'hero')
            const heroContent = heroSection?.content as {
                headline?: unknown
                subheadline?: unknown
                ctaText?: unknown
            } | undefined

            if (heroContent?.headline && typeof heroContent.headline === 'string') {
                setHeadline(heroContent.headline)
            }
            if (heroContent?.subheadline && typeof heroContent.subheadline === 'string') {
                setSubheadline(heroContent.subheadline)
            }
            if (!ctaManuallyEdited && heroContent?.ctaText && typeof heroContent.ctaText === 'string') {
                setCtaText(heroContent.ctaText)
            }
        }
    }, [
        aiPrompt,
        selectedProduct,
        buildPromptFromProduct,
        generateSections,
        name,
        headline,
        subheadline,
        generateVisuals,
        imageModel,
        ctaText,
        ctaManuallyEdited,
    ])

    useEffect(() => {
        if (!selectedProductId) {
            resetGeneration()
            return
        }

        const selectedProductData = products.find((product) => product.id === selectedProductId)
        if (!selectedProductData) {
            resetGeneration()
            return
        }

        const productPrompt = buildPromptFromProduct(selectedProductData)
        void generateSections({
            prompt: productPrompt,
            pageContext: {
                name: selectedProductData.name,
                headline: selectedProductData.name,
                subheadline: selectedProductData.shortDescription,
            },
            productContext: buildProductContext(selectedProductData),
            productId: selectedProductData.id,
            imageGeneration: {
                enabled: generateVisuals,
                model: imageModel,
            },
        })
    }, [selectedProductId, products, buildPromptFromProduct, generateSections, resetGeneration, generateVisuals, imageModel])

    // AI Generation — manual trigger via "Gerar com IA" button
    const handleGenerate = useCallback(async () => {
        await generateFromCurrentContext()
    }, [generateFromCurrentContext])

    // Compute readiness score
    const aiGenerated = generation.status === 'success' && hasValidSections
    const aiError = generation.status === 'error' ? generation.error : ''
    const generatedSectionsCount = generation.sectionsCount
    const generatedSectionsJson = generation.sectionsJson
    const generatedDesignSystemJson = generation.generatedDesignSystemJson
    const sectionsPayloadBytes = generatedSectionsJson
        ? new TextEncoder().encode(generatedSectionsJson).length
        : 0
    const MAX_INLINE_SECTIONS_PAYLOAD_BYTES = 700_000
    const shouldSendSectionsJson = !!generatedSectionsJson && sectionsPayloadBytes <= MAX_INLINE_SECTIONS_PAYLOAD_BYTES

    const readinessItems = [
        { label: 'Nome da página', done: !!name.trim() },
        { label: 'Slug (URL)', done: !!slug.trim() },
        { label: 'Título principal', done: !!headline.trim() },
        { label: 'Subtítulo', done: !!subheadline.trim() },
        { label: 'Texto do CTA', done: !!ctaText.trim() },
        { label: 'Paleta de cores', done: true },
        { label: 'Seções geradas por IA', done: aiGenerated },
        { label: 'Produto vinculado', done: !!selectedProductId },
        { label: 'System prompt do bot', done: !!chatbotSystemPrompt.trim() },
    ]
    const readinessScore = readinessItems.filter(i => i.done).length
    const readinessTotal = readinessItems.length
    const readinessPct = Math.round((readinessScore / readinessTotal) * 100)
    const requiresAiBeforeCreate = !!selectedProductId
    const isMissingRequiredAiSections = requiresAiBeforeCreate && !hasValidSections
    const submitDisabled = isPending || isGenerating || isMissingRequiredAiSections
    const hasPendingThemeChange = !!pendingDesignSystem && !isSameDesignSystem(pendingDesignSystem, designSystem)

    const handlePresetSelect = useCallback((next: DesignSystem) => {
        setPendingDesignSystem(next)
        setDesignSystemAlert('Novo tema selecionado. Clique em "Aplicar tema" para confirmar.')
    }, [])

    const applyPendingTheme = useCallback(() => {
        if (!pendingDesignSystem || isSameDesignSystem(pendingDesignSystem, designSystem)) return
        setDesignSystem(pendingDesignSystem)
        setDesignSystemAlert('Design System aplicado com sucesso.')
    }, [pendingDesignSystem, designSystem])

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main form — Left 2 cols */}
            <div className="lg:col-span-2 space-y-6">

                {/* Step 1: Product Selector */}
                <div className="bg-card border border-border rounded-(--radius) overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-linear-to-r from-[hsl(var(--success-subtle))] to-accent/30">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--success))]/10 flex items-center justify-center">
                                <Package className="w-4.5 h-4.5 text-[hsl(var(--success))]" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-foreground">Vincular Produto / Serviço</h2>
                                <p className="text-[11px] text-muted-foreground">Selecione um produto para preencher automaticamente e gerar seções com IA baseadas nos dados reais.</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        {products.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleProductSelect(null)}
                                        className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all ${
                                            !selectedProductId
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                                : 'border-border hover:border-primary/30 hover:bg-secondary/50'
                                        }`}
                                    >
                                        <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-muted-foreground">Nenhum produto</p>
                                            <p className="text-[11px] text-muted-foreground/70">Landing page genérica</p>
                                        </div>
                                        {!selectedProductId && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-auto" />}
                                    </button>
                                    {products.map((product) => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => handleProductSelect(product.id)}
                                            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                                                selectedProductId === product.id
                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                                    : 'border-border hover:border-primary/30 hover:bg-secondary/50'
                                            }`}
                                        >
                                            <Package className="w-4 h-4 text-primary shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                                                <p className="text-[11px] text-muted-foreground truncate">
                                                    {product.shortDescription || (product.type === 'service' ? 'Serviço' : 'Produto')}
                                                </p>
                                            </div>
                                            {selectedProductId === product.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                                        </button>
                                    ))}
                                </div>
                                {selectedProduct && (
                                    <div className="mt-4 p-3 rounded-lg bg-[hsl(var(--success-subtle))] border border-[hsl(var(--success))]/20">
                                        <p className="text-xs text-[hsl(var(--success))] font-medium flex items-center gap-1.5">
                                            {isGenerating ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    Gerando seções da landing page com IA a partir dos dados do produto...
                                                </>
                                            ) : aiGenerated ? (
                                                <>
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Produto vinculado — {generatedSectionsCount} seções geradas automaticamente pela IA
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Produto vinculado — campos preenchidos automaticamente
                                                </>
                                            )}
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-6">
                                <Package className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">Nenhum produto ativo cadastrado.</p>
                                <p className="text-xs text-muted-foreground/70 mt-1 mb-4">
                                    Crie um produto primeiro para vincular à landing page e habilitar geração inteligente.
                                </p>
                                <Link
                                    href="/products/new"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                                >
                                    <Package className="w-3.5 h-3.5" />
                                    Criar Produto / Serviço
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Step 2: AI Generation Card */}
                <div className="bg-card border border-border rounded-(--radius) overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-linear-to-r from-[hsl(var(--primary-subtle))] to-accent/30">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Bot className="w-4.5 h-4.5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-foreground">Assistente IA</h2>
                                <p className="text-[11px] text-muted-foreground">
                                    {aiGenerated && selectedProduct
                                        ? `Seções geradas com base nos dados de "${selectedProduct.name}". Edite o prompt e re-gere se quiser ajustar.`
                                        : selectedProduct
                                            ? `Dados do produto "${selectedProduct.name}" serão usados para gerar seções otimizadas.`
                                            : 'Descreva o negócio e gere todas as seções da landing page com um clique.'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="ai-prompt" className="text-xs font-semibold text-foreground">
                                Descreva o negócio / produto / serviço
                            </Label>
                            <Textarea
                                id="ai-prompt"
                                value={aiPrompt}
                                onChange={e => setAiPrompt(e.target.value)}
                                placeholder={selectedProduct
                                    ? `Dados do "${selectedProduct.name}" já foram carregados. Adicione detalhes extras se quiser (localização, promoções, etc.)...`
                                    : 'Ex: Clínica odontológica premium em SP, especializada em implantes, 3 planos a partir de R$800...'}
                                rows={3}
                                className="bg-background border-input text-sm"
                                disabled={isGenerating}
                            />
                            <p className="text-[11px] text-muted-foreground">
                                {selectedProduct
                                    ? 'A IA usará as informações completas do produto (features, benefícios, FAQs, preço, público-alvo) para gerar seções hiper-específicas.'
                                    : 'Quanto mais detalhes (nicho, público-alvo, preços, diferenciais), mais preciso e persuasivo será o resultado.'}
                            </p>
                        </div>

                        <div className="rounded-lg border border-border bg-background p-3.5 space-y-3">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={generateVisuals}
                                    onChange={(e) => setGenerateVisuals(e.target.checked)}
                                    className="h-4 w-4 rounded border-input"
                                />
                                <span className="text-xs font-semibold text-foreground">
                                    Gerar imagens com Nano Banana (Hero + destaques)
                                </span>
                            </label>

                            {generateVisuals && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-foreground">Modelo de imagem</Label>
                                    <select
                                        value={imageModel}
                                        onChange={(e) => setImageModel(e.target.value as ImageModelId)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    >
                                        {IMAGE_MODELS.map((model) => (
                                            <option key={model.id} value={model.id}>
                                                {model.name} ({model.badge})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[11px] text-muted-foreground">
                                        Ative apenas quando quiser landing visual completa gerada por IA, pois essa opção aumenta o consumo de tokens e imagem.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                onClick={handleGenerate}
                                disabled={isGenerating || (!aiPrompt.trim() && !selectedProduct)}
                                variant={aiGenerated ? 'outline' : 'default'}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Gerando seções...
                                    </>
                                ) : aiGenerated ? (
                                    <>
                                        <Wand2 className="w-4 h-4 mr-2" />
                                        Re-gerar Seções
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-4 h-4 mr-2" />
                                        {selectedProduct ? `Gerar com dados de "${selectedProduct.name}"` : 'Gerar Seções com IA'}
                                    </>
                                )}
                            </Button>
                            {aiGenerated && (
                                <span className="flex items-center gap-1.5 text-xs text-[hsl(var(--success))] font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {generatedSectionsCount} seções geradas! Revise abaixo e crie a página.
                                </span>
                            )}
                        </div>

                        {aiError && (
                            <InlineError message={aiError} />
                        )}

                        {isGenerating && (
                            <p className="text-xs text-center text-muted-foreground">
                                A IA está criando seções personalizadas com copywriting otimizado para conversão. Isso pode levar alguns segundos...
                            </p>
                        )}
                    </div>
                </div>

                {/* Step 3: Hero Template */}
                <div className="bg-card border border-border rounded-(--radius) overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-linear-to-r from-violet-500/5 to-accent/30">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                <LayoutTemplate className="w-4.5 h-4.5 text-violet-500" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-foreground">Modelo de Hero</h2>
                                <p className="text-[11px] text-muted-foreground">Escolha o layout visual da seção principal da landing page.</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <HeroTemplatePicker value={heroLayoutPreset} onChange={setHeroLayoutPreset} />
                    </div>
                </div>

                {/* Step 4: Form Card */}
                <div className="bg-card border border-border rounded-(--radius) overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-accent/30">
                        <h2 className="text-sm font-bold text-foreground">Configurar Landing Page</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Revise e ajuste os campos. Após criar, você poderá editar as seções geradas em detalhes.</p>
                    </div>
                    <form action={action} className="p-6 space-y-8">
                        {/* Hidden fields */}
                        <input type="hidden" name="heroLayoutPreset" value={heroLayoutPreset} />
                        <input type="hidden" name="designSystem" value={JSON.stringify(designSystem)} />
                        <input type="hidden" name="generateVisuals" value={generateVisuals ? '1' : '0'} />
                        <input type="hidden" name="imageModel" value={imageModel} />
                        <input type="hidden" name="aiPrompt" value={aiPrompt} />
                        {selectedProductId && <input type="hidden" name="productId" value={selectedProductId} />}
                        {shouldSendSectionsJson && <input type="hidden" name="sectionsJson" value={generatedSectionsJson} />}
                        {generatedDesignSystemJson && <input type="hidden" name="generatedDesignSystem" value={generatedDesignSystemJson} />}

                        {/* Informações Básicas */}
                        <div className="space-y-4">
                            <SectionHeader icon={Globe} title="Informações Básicas" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="name" className="text-xs font-semibold text-foreground">
                                        Nome da Página <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name" name="name"
                                        value={name} onChange={e => handleNameChange(e.target.value)}
                                        placeholder="Ex: Landing Page — Curso de Marketing"
                                        required
                                        className="bg-background border-input h-10 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="slug" className="text-xs font-semibold text-foreground">
                                        Slug (URL) <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="slug" name="slug"
                                        value={slug} onChange={e => handleSlugChange(e.target.value)}
                                        placeholder="minha-landing-page"
                                        required
                                        pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                                        title="Apenas letras minúsculas, números e hifens"
                                        className="bg-background border-input h-10 text-sm font-mono"
                                    />
                                    <p className="text-[11px] text-muted-foreground">URL pública: /p/{slug || 'seu-slug'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Conteúdo */}
                        <div className="space-y-4">
                            <SectionHeader icon={FileText} title="Conteúdo" description="Títulos e textos exibidos na hero section e CTA." />
                            <div className="space-y-1.5">
                                <Label htmlFor="headline" className="text-xs font-semibold text-foreground">Título Principal (headline)</Label>
                                <Input
                                    id="headline" name="headline"
                                    value={headline} onChange={e => setHeadline(e.target.value)}
                                    placeholder="Transforme seu negócio com nossa solução"
                                    className="bg-background border-input h-10 text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="subheadline" className="text-xs font-semibold text-foreground">Subtítulo</Label>
                                <Textarea
                                    id="subheadline" name="subheadline"
                                    value={subheadline} onChange={e => setSubheadline(e.target.value)}
                                    placeholder="Descrição breve que reforça a proposta de valor..."
                                    rows={2}
                                    className="bg-background border-input text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="ctaText" className="text-xs font-semibold text-foreground">Texto do CTA</Label>
                                    <Input
                                        id="ctaText" name="ctaText"
                                        value={ctaText}
                                        onChange={e => {
                                            setCtaText(e.target.value)
                                            setCtaManuallyEdited(true)
                                        }}
                                        placeholder="Fale conosco"
                                        className="bg-background border-input h-10 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="chatbotName" className="text-xs font-semibold text-foreground">Nome do Chatbot</Label>
                                    <Input
                                        id="chatbotName" name="chatbotName"
                                        value={chatbotName} onChange={e => setChatbotName(e.target.value)}
                                        placeholder="Assistente"
                                        className="bg-background border-input h-10 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Paleta de Cores */}
                        <div className="space-y-4">
                            <SectionHeader icon={Palette} title="Paleta de Cores" description={aiGenerated ? 'A IA selecionou o tema ideal. Você pode alterar se preferir.' : 'Escolha a paleta visual da landing page.'} />

                            {designSystemAlert && (
                                <div className={`text-xs rounded-md px-3 py-2 border ${
                                    hasPendingThemeChange
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))] border-[hsl(var(--success))]/30'
                                }`}>
                                    {designSystemAlert}
                                </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {DESIGN_PRESETS.map((preset) => {
                                    const isSelected = isSameDesignSystem(designSystem, preset.designSystem)
                                    const isPending = !!pendingDesignSystem && isSameDesignSystem(pendingDesignSystem, preset.designSystem)
                                    return (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => handlePresetSelect(preset.designSystem)}
                                            className={`relative flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                                                isPending
                                                    ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-300'
                                                    : isSelected
                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                                    : 'border-border hover:border-primary/30 hover:bg-secondary/50'
                                            }`}
                                        >
                                            <div className="flex gap-1 shrink-0">
                                                {[preset.designSystem.palette.primary, preset.designSystem.palette.secondary, preset.designSystem.palette.accent].map((color, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-4 h-4 rounded-full border border-white/20"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-foreground truncate">{preset.name}</p>
                                                {isPending && <p className="text-[10px] text-amber-700 mt-0.5">Pendente</p>}
                                            </div>
                                            {isSelected && !isPending && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-auto" />}
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant={hasPendingThemeChange ? 'default' : 'outline'}
                                    disabled={!hasPendingThemeChange}
                                    onClick={applyPendingTheme}
                                    className="h-9 px-4 text-xs font-semibold"
                                >
                                    Aplicar tema
                                </Button>
                                {hasPendingThemeChange && (
                                    <span className="text-xs text-muted-foreground">Existem mudanças de tema pendentes.</span>
                                )}
                            </div>
                        </div>

                        {/* Chatbot */}
                        <div className="space-y-4">
                            <SectionHeader icon={MessageSquare} title="Chatbot Inteligente" description="Configure o assistente que ficará disponível na landing page." />
                            <div className="space-y-1.5">
                                <Label htmlFor="chatbotWelcomeMessage" className="text-xs font-semibold text-foreground">Mensagem de Boas-vindas</Label>
                                <Textarea
                                    id="chatbotWelcomeMessage" name="chatbotWelcomeMessage"
                                    value={chatbotWelcomeMessage} onChange={e => setChatbotWelcomeMessage(e.target.value)}
                                    placeholder="Olá! Como posso ajudar?"
                                    rows={2}
                                    className="bg-background border-input text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="chatbotSystemPrompt" className="text-xs font-semibold text-foreground">
                                    Instruções do Bot (System Prompt)
                                    {selectedProduct && (
                                        <span className="ml-2 text-[hsl(var(--success))] font-normal">— preenchido com dados do produto</span>
                                    )}
                                </Label>
                                <Textarea
                                    id="chatbotSystemPrompt" name="chatbotSystemPrompt"
                                    value={chatbotSystemPrompt} onChange={e => setChatbotSystemPrompt(e.target.value)}
                                    placeholder="Você é um assistente especializado em..."
                                    rows={5}
                                    className="bg-background border-input text-sm"
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Essas instruções definem como o chatbot responde. Quanto mais detalhado, melhor.
                                </p>
                            </div>
                        </div>

                        {/* Submit */}
                        {state.error && (
                            <InlineError message={state.error} />
                        )}

                        {isMissingRequiredAiSections && (
                            <InlineNotice
                                variant="warning"
                                message="Aguarde a IA gerar as seções com os dados do produto antes de criar a landing page."
                            />
                        )}

                        {aiGenerated && !shouldSendSectionsJson && (
                            <InlineNotice
                                variant="warning"
                                message="Conteúdo visual grande detectado. As seções serão regeneradas no servidor no momento do salvamento para evitar erro de limite de payload."
                            />
                        )}

                        <Button type="submit" disabled={submitDisabled} className="w-full h-11 text-sm font-bold">
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Criando Landing Page...
                                </>
                            ) : isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Gerando seções com IA...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Criar Landing Page
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Sidebar — Right col */}
            <div className="space-y-6">
                {/* Readiness Score */}
                <div className="bg-card border border-border rounded-(--radius) p-5 space-y-4 sticky top-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-foreground">Prontidão</h3>
                        <span className={`text-lg font-black tabular-nums ${
                            readinessPct >= 80 ? 'text-[hsl(var(--success))]'
                                : readinessPct >= 50 ? 'text-[hsl(var(--warning,45_100%_50%))]'
                                    : 'text-muted-foreground'
                        }`}>
                            {readinessPct}%
                        </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                readinessPct >= 80 ? 'bg-[hsl(var(--success))]'
                                    : readinessPct >= 50 ? 'bg-[hsl(var(--warning,45_100%_50%))]'
                                        : 'bg-muted-foreground'
                            }`}
                            style={{ width: `${readinessPct}%` }}
                        />
                    </div>
                    <div className="space-y-1.5">
                        {readinessItems.map((item) => (
                            <div key={item.label} className="flex items-center gap-2 text-xs">
                                {item.done ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--success))] shrink-0" />
                                ) : (
                                    <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />
                                )}
                                <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Generated Summary */}
                {aiGenerated && (
                    <div className="bg-card border border-[hsl(var(--success))]/30 rounded-(--radius) p-5 space-y-3">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[hsl(var(--success))]" />
                            <h3 className="text-sm font-bold text-foreground">IA Gerou</h3>
                        </div>
                        <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Seções geradas</span>
                                <span className="font-bold text-foreground">{generatedSectionsCount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tema visual</span>
                                <span className="font-bold text-foreground">{designSystem.style}</span>
                            </div>
                            {selectedProduct && (
                                <div className="flex justify-between">
                                    <span>Produto base</span>
                                    <span className="font-bold text-foreground truncate max-w-30">{selectedProduct.name}</span>
                                </div>
                            )}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            As seções serão salvas automaticamente ao criar a página. Você poderá editá-las depois na tela de detalhes.
                        </p>
                    </div>
                )}

                {/* Tips */}
                <div className="bg-card border border-border rounded-(--radius) p-5 space-y-3">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-bold text-foreground">Dicas</h3>
                    </div>
                    <ul className="space-y-2 text-[11px] text-muted-foreground leading-relaxed">
                        <li className="flex gap-2">
                            <span className="text-primary font-bold shrink-0">1.</span>
                            Vincule um produto para que a IA use dados reais (descrição, features, preço).
                        </li>
                        <li className="flex gap-2">
                            <span className="text-primary font-bold shrink-0">2.</span>
                            Clique em &quot;Gerar com IA&quot; para criar as seções automaticamente.
                        </li>
                        <li className="flex gap-2">
                            <span className="text-primary font-bold shrink-0">3.</span>
                            Após criar, edite cada seção em detalhes na tela de gerenciamento.
                        </li>
                        <li className="flex gap-2">
                            <span className="text-primary font-bold shrink-0">4.</span>
                            O system prompt do chatbot é preenchido automaticamente com os dados do produto.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

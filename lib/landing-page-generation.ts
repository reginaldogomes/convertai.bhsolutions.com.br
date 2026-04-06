import { generateObject } from 'ai'
import { z } from 'zod'
import { agentModel } from '@/lib/ai'
import { generateNanoBananaImageDataUrl, type NanoBananaModelId } from './nano-banana'
import { DEFAULT_SECTION_CONTENT, SECTION_LABELS, type SectionType } from '@/domain/entities'
import { inferDesignSystemFromText } from '@/domain/value-objects/design-system'
import type { DesignSystem } from '@/domain/value-objects/design-system'

export interface LandingPageGenerationInput {
    prompt: string
    pageContext?: { name?: string; headline?: string; subheadline?: string }
    productContext?: string
    knowledgeBaseContext?: string
    imageGeneration?: {
        enabled?: boolean
        model?: NanoBananaModelId
    }
}

export interface GeneratedSection {
    type: SectionType
    content: Record<string, unknown>
}

export interface LandingPageGenerationOutput {
    sections: GeneratedSection[]
    designSystem: DesignSystem
}

const heroContentSchema = z.object({
    kicker: z.string().default('Oferta especial por tempo limitado'),
    headline: z.string(),
    subheadline: z.string(),
    ctaText: z.string(),
    ctaUrl: z.string().default('#'),
    backgroundImageUrl: z.string().nullable().default(null),
    heroImageUrl: z.string().nullable().default(null),
    trustBadges: z.array(z.string()).max(6).default([]),
    alignment: z.enum(['center', 'left']).default('center'),
})

const featureItemSchema = z.object({
    icon: z.string().min(1),
    title: z.string(),
    description: z.string(),
})

const featuresContentSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    columns: z.number().int().min(2).max(4).default(3),
    items: z.array(featureItemSchema).min(2).max(6),
})

const benefitsGridContentSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    items: z.array(
        z.object({
            title: z.string(),
            description: z.string(),
        })
    ).min(3).max(6),
})

const processStepsContentSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    steps: z.array(
        z.object({
            title: z.string(),
            description: z.string(),
        })
    ).min(3).max(5),
})

const testimonialItemSchema = z.object({
    name: z.string(),
    role: z.string(),
    company: z.string(),
    avatarUrl: z.string().nullable().default(null),
    quote: z.string(),
    rating: z.number().min(1).max(5),
})

const testimonialsContentSchema = z.object({
    title: z.string(),
    items: z.array(testimonialItemSchema).min(1).max(6),
})

const faqItemSchema = z.object({
    question: z.string(),
    answer: z.string(),
})

const faqContentSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    items: z.array(faqItemSchema).min(2).max(8),
})

const pricingTierSchema = z.object({
    name: z.string(),
    price: z.string(),
    period: z.string(),
    description: z.string(),
    features: z.array(z.string()).min(1).max(8),
    ctaText: z.string(),
    highlighted: z.boolean(),
})

const pricingContentSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    tiers: z.array(pricingTierSchema).min(1).max(4),
})

const contactFormContentSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    fields: z.array(z.enum(['name', 'email', 'phone', 'company', 'message'])),
    submitText: z.string(),
    successMessage: z.string(),
})

const ctaBannerContentSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    ctaText: z.string(),
    ctaUrl: z.string().default('#'),
})

const videoContentSchema = z.object({
    title: z.string(),
    videoUrl: z.string().default(''),
    provider: z.enum(['youtube', 'vimeo']).default('youtube'),
})

const statItemSchema = z.object({
    value: z.string(),
    label: z.string(),
})

const statsContentSchema = z.object({
    title: z.string(),
    items: z.array(statItemSchema).min(2).max(6),
})

const logoCloudContentSchema = z.object({
    title: z.string(),
    logos: z.array(
        z.object({
            name: z.string(),
            imageUrl: z.string(),
        })
    ).max(8).default([]),
})

const galleryContentSchema = z.object({
    title: z.string(),
    images: z.array(
        z.object({
            url: z.string(),
            alt: z.string(),
        })
    ).max(8).default([]),
    columns: z.number().int().min(2).max(4).default(3),
})

const sectionSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('hero'), content: heroContentSchema }),
    z.object({ type: z.literal('features'), content: featuresContentSchema }),
    z.object({ type: z.literal('benefits_grid'), content: benefitsGridContentSchema }),
    z.object({ type: z.literal('process_steps'), content: processStepsContentSchema }),
    z.object({ type: z.literal('testimonials'), content: testimonialsContentSchema }),
    z.object({ type: z.literal('faq'), content: faqContentSchema }),
    z.object({ type: z.literal('pricing'), content: pricingContentSchema }),
    z.object({ type: z.literal('contact_form'), content: contactFormContentSchema }),
    z.object({ type: z.literal('cta_banner'), content: ctaBannerContentSchema }),
    z.object({ type: z.literal('video'), content: videoContentSchema }),
    z.object({ type: z.literal('stats'), content: statsContentSchema }),
    z.object({ type: z.literal('logo_cloud'), content: logoCloudContentSchema }),
    z.object({ type: z.literal('gallery'), content: galleryContentSchema }),
])

const generateResponseSchema = z.object({
    sections: z.array(sectionSchema).min(2).max(10),
})

const availableSectionTypes = [
    'hero',
    'features',
    'benefits_grid',
    'process_steps',
    'testimonials',
    'faq',
    'pricing',
    'contact_form',
    'cta_banner',
    'video',
    'stats',
    'logo_cloud',
    'gallery',
] as const

const looseGenerateResponseSchema = z.object({
    sections: z.array(z.object({
        type: z.enum(availableSectionTypes),
        content: z.record(z.string(), z.unknown()).default({}),
    })).min(2).max(10),
})

const SECTION_LIST = Object.entries(SECTION_LABELS)
    .map(([key, label]) => `- "${key}": ${label}`)
    .join('\n')

const SYSTEM_PROMPT = `Você é um copywriter e estrategista de conversão especializado em landing pages de alta performance para o mercado brasileiro.

O usuário vai descrever um negócio/produto/serviço. Você deve gerar um array de seções otimizado para conversão, com conteúdo REAL, persuasivo e ESPECÍFICO ao nicho descrito.

## REGRA #1 — PERSONALIZAÇÃO ABSOLUTA:
CADA PALAVRA do conteúdo gerado DEVE refletir o nicho, localização, público-alvo e diferenciais informados.
- Se o usuário mencionou "imobiliária em São Paulo", toda a landing page deve falar sobre imóveis, bairros de SP, preços de imóveis, etc.
- Se mencionou "clínica odontológica", fale de procedimentos odontológicos, saúde bucal, etc.
- NUNCA gere conteúdo genérico que poderia servir para qualquer negócio.
- Use a localização (cidade, bairro) mencionada em headlines, CTAs, depoimentos e FAQs.
- Se o usuário informou "Nome da página/empresa", use esse nome nos textos quando natural.

## Seções disponíveis:
${SECTION_LIST}

## Regras gerais:
1. Todo texto DEVE ser em português brasileiro impecável
2. Sempre comece com "hero" — nunca omita
3. Sempre termine com "contact_form" ou "cta_banner"
4. Escolha entre 5 e 10 seções, apenas as mais relevantes para o nicho
5. Priorize estrutura de alta conversão: hero, prova de valor (features/benefits), prova social, objeções (faq), CTA final
6. Use "process_steps" para serviços com onboarding/implantação e "benefits_grid" para reforçar transformação
7. "gallery" e "logo_cloud" são opcionais e devem aparecer apenas quando fizer sentido estratégico
8. NÃO inclua "video" a menos que o usuário mencione vídeo explicitamente
9. Evite frases genéricas; use linguagem orientada a resultado, clareza e confiança

## Estrutura ideal de referência (quando aplicável):
- Hero simples e claro com 1 CTA
- Proposta de valor principal
- Benefícios/Vantagens
- Prova social (depoimentos, logos, números)
- Produto/serviço e como funciona
- Objeções e dúvidas (FAQ)
- CTA final
- Formulário de contato

## Regras de conversão adicionais:
- Inclua FAQ com objeções reais (preço, risco, prazo, suporte) sempre que possível
- Inclua ao menos um bloco de prova social (testimonials, stats ou logo_cloud)
- Use CTA orientado a ação concreta (ex.: "Quero uma demonstração", "Falar com especialista")
- Não gere mais de 1 CTA primário por seção`

export async function generateLandingPageSections(input: LandingPageGenerationInput): Promise<LandingPageGenerationOutput> {
    const prompt = input.prompt?.trim()
    if (!prompt || prompt.length < 10) {
        throw new Error('Descrição muito curta. Descreva o negócio com pelo menos 10 caracteres.')
    }

    const contextParts: string[] = []
    if (input.pageContext?.name) contextParts.push(`Nome da página/empresa: ${input.pageContext.name}`)
    if (input.pageContext?.headline) contextParts.push(`Headline atual: ${input.pageContext.headline}`)
    if (input.pageContext?.subheadline) contextParts.push(`Subheadline atual: ${input.pageContext.subheadline}`)

    if (input.productContext && typeof input.productContext === 'string') {
        contextParts.push('IMPORTANTE: A landing page DEVE ser escrita com base prioritária nos dados reais do produto vinculado abaixo. Evite textos genéricos e não invente recursos.')
        contextParts.push(`\n--- DADOS DO PRODUTO/SERVIÇO VINCULADO ---\n${input.productContext}\n--- FIM DOS DADOS DO PRODUTO ---`)
    }

    if (input.knowledgeBaseContext && typeof input.knowledgeBaseContext === 'string') {
        contextParts.push('IMPORTANTE: Use a base de conhecimento abaixo como contexto de verdade para definir as seções mais relevantes e a copy final.')
        contextParts.push(`\n--- BASE DE CONHECIMENTO RELACIONADA ---\n${input.knowledgeBaseContext}\n--- FIM DA BASE DE CONHECIMENTO ---`)
    }

    if (input.imageGeneration?.enabled) {
        contextParts.push('A geração visual está habilitada. Você pode incluir seções visuais (como gallery) quando fizer sentido para aumentar percepção de valor e conversão.')
    }

    const enrichedPrompt = contextParts.length > 0
        ? `${contextParts.join('\n')}\n\nDescrição do negócio/produto/serviço: ${prompt}`
        : `Negócio/produto/serviço: ${prompt}`

    const designSystem = inferDesignSystemFromText(enrichedPrompt)

    let rawSections: Array<{ type: typeof availableSectionTypes[number]; content: Record<string, unknown> }>

    try {
        const { object } = await generateObject({
            model: agentModel,
            schema: generateResponseSchema,
            system: SYSTEM_PROMPT,
            prompt: enrichedPrompt,
            temperature: 0.4,
            maxOutputTokens: 4096,
        })

        rawSections = object.sections.map((s) => ({
            type: s.type as typeof availableSectionTypes[number],
            content: s.content as unknown as Record<string, unknown>,
        }))
    } catch {
        const { object } = await generateObject({
            model: agentModel,
            schema: looseGenerateResponseSchema,
            system: SYSTEM_PROMPT,
            prompt: enrichedPrompt,
            temperature: 0.4,
            maxOutputTokens: 4096,
        })

        rawSections = object.sections
    }

    const sections = normalizeSections(rawSections)
    const sectionsWithVisuals = await enrichSectionsWithImages(sections, input)
    return { sections: sectionsWithVisuals, designSystem }
}

function normalizeSections(sections: Array<{ type: typeof availableSectionTypes[number]; content: Record<string, unknown> }>): GeneratedSection[] {
    const normalized = sections.map((section) => ({
        type: section.type,
        content: normalizeSectionContent(section.type, section.content),
    }))

    const hasHero = normalized.some((section) => section.type === 'hero')
    if (!hasHero) {
        normalized.unshift({ type: 'hero', content: DEFAULT_SECTION_CONTENT.hero })
    }

    if (normalized[0]?.type !== 'hero') {
        const heroIndex = normalized.findIndex((section) => section.type === 'hero')
        if (heroIndex > 0) {
            const [hero] = normalized.splice(heroIndex, 1)
            normalized.unshift(hero)
        }
    }

    const lastType = normalized[normalized.length - 1]?.type
    if (lastType !== 'contact_form' && lastType !== 'cta_banner') {
        normalized.push({ type: 'cta_banner', content: DEFAULT_SECTION_CONTENT.cta_banner })
    }

    const conversionOrder: Record<SectionType, number> = {
        hero: 0,
        logo_cloud: 1,
        stats: 2,
        features: 3,
        benefits_grid: 4,
        process_steps: 5,
        pricing: 6,
        gallery: 7,
        video: 8,
        testimonials: 9,
        faq: 10,
        cta_banner: 11,
        contact_form: 12,
    }

    // Keep a conversion-friendly progression even if AI returns mixed ordering.
    normalized.sort((a, b) => {
        const aRank = conversionOrder[a.type]
        const bRank = conversionOrder[b.type]
        if (aRank !== bRank) return aRank - bRank
        return 0
    })

    if (normalized[0]?.type !== 'hero') {
        const heroIndex = normalized.findIndex((section) => section.type === 'hero')
        if (heroIndex > 0) {
            const [hero] = normalized.splice(heroIndex, 1)
            normalized.unshift(hero)
        }
    }

    return normalized.slice(0, 10)
}

async function enrichSectionsWithImages(sections: GeneratedSection[], input: LandingPageGenerationInput): Promise<GeneratedSection[]> {
    if (!input.imageGeneration?.enabled) {
        return sections
    }

    const model = input.imageGeneration.model ?? 'gemini-2.5-flash-image'
    const cloned = sections.map((section) => ({ ...section, content: { ...section.content } }))
    const hero = cloned.find((section) => section.type === 'hero')

    if (hero) {
        const heroContent = hero.content as {
            headline?: string
            subheadline?: string
            backgroundImageUrl?: string | null
            heroImageUrl?: string | null
        }

        const heroVisualPrompt = [
            'Crie uma imagem publicitária premium para hero de landing page, sem texto na imagem.',
            heroContent.headline ?? '',
            heroContent.subheadline ?? '',
            input.prompt,
            'Estilo fotográfico realista, iluminação cinematográfica, composição limpa e foco em conversão.',
        ].filter(Boolean).join(' ')

        const generatedHeroImage = await generateNanoBananaImageDataUrl({
            model,
            prompt: heroVisualPrompt,
            aspectRatio: '16:9',
        })

        if (generatedHeroImage) {
            if (!heroContent.backgroundImageUrl) {
                heroContent.backgroundImageUrl = generatedHeroImage
            }
            if (!heroContent.heroImageUrl) {
                heroContent.heroImageUrl = generatedHeroImage
            }
            hero.content = heroContent as Record<string, unknown>
        }
    }

    const gallery = cloned.find((section) => section.type === 'gallery')
    if (gallery) {
        const galleryContent = gallery.content as {
            title?: string
            images?: Array<{ url: string; alt: string }>
            columns?: 2 | 3 | 4
        }

        const existing = Array.isArray(galleryContent.images) ? galleryContent.images.filter((item) => !!item?.url) : []
        if (existing.length < 2) {
            const promptBase = [
                'Imagem de destaque para seção visual de landing page, sem textos e sem logos.',
                input.prompt,
                hero?.content?.headline ? String((hero.content as Record<string, unknown>).headline) : '',
            ].filter(Boolean).join(' ')

            const generatedGalleryImages: Array<{ url: string; alt: string }> = [...existing]
            while (generatedGalleryImages.length < 3) {
                const image = await generateNanoBananaImageDataUrl({
                    model,
                    prompt: `${promptBase} Variação visual ${generatedGalleryImages.length + 1}.`,
                    aspectRatio: '4:3',
                })
                if (!image) break
                generatedGalleryImages.push({
                    url: image,
                    alt: `Imagem de destaque ${generatedGalleryImages.length + 1}`,
                })
            }

            gallery.content = {
                title: galleryContent.title || 'Veja o que torna essa solução diferente',
                columns: galleryContent.columns ?? 3,
                images: generatedGalleryImages,
            }
        }
    }

    return cloned
}

function normalizeSectionContent(type: SectionType, content: Record<string, unknown>) {
    switch (type) {
        case 'hero':
            {
                const trustBadges = Array.isArray(content.trustBadges)
                    ? content.trustBadges.map((item) => asString(item, '')).filter(Boolean).slice(0, 6)
                    : []

            return {
                kicker: asString(content.kicker, DEFAULT_SECTION_CONTENT.hero.kicker),
                headline: asString(content.headline, DEFAULT_SECTION_CONTENT.hero.headline),
                subheadline: asString(content.subheadline, DEFAULT_SECTION_CONTENT.hero.subheadline),
                ctaText: asString(content.ctaText, DEFAULT_SECTION_CONTENT.hero.ctaText),
                ctaUrl: asString(content.ctaUrl, DEFAULT_SECTION_CONTENT.hero.ctaUrl),
                backgroundImageUrl: asNullableString(content.backgroundImageUrl, DEFAULT_SECTION_CONTENT.hero.backgroundImageUrl),
                heroImageUrl: asNullableString(content.heroImageUrl, DEFAULT_SECTION_CONTENT.hero.heroImageUrl),
                trustBadges: trustBadges.length > 0 ? trustBadges : DEFAULT_SECTION_CONTENT.hero.trustBadges,
                alignment: content.alignment === 'left' ? 'left' : 'center',
            }
            }
        case 'features': {
            const itemsRaw = Array.isArray(content.items) ? content.items : []
            const items = itemsRaw
                .map((item): { icon: string; title: string; description: string } => {
                    const obj = asRecord(item)
                    return {
                        icon: asString(obj.icon, 'Zap'),
                        title: asString(obj.title, 'Diferencial'),
                        description: asString(obj.description, 'Descrição do diferencial.'),
                    }
                })
                .slice(0, 6)

            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.features.title),
                subtitle: asString(content.subtitle, DEFAULT_SECTION_CONTENT.features.subtitle),
                columns: normalizeColumns(content.columns),
                items: items.length >= 2 ? items : DEFAULT_SECTION_CONTENT.features.items,
            }
        }
        case 'benefits_grid': {
            const itemsRaw = Array.isArray(content.items) ? content.items : []
            const items = itemsRaw
                .map((item) => {
                    const obj = asRecord(item)
                    return {
                        title: asString(obj.title, 'Benefício principal'),
                        description: asString(obj.description, 'Descrição do benefício.'),
                    }
                })
                .slice(0, 6)

            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.benefits_grid.title),
                subtitle: asString(content.subtitle, DEFAULT_SECTION_CONTENT.benefits_grid.subtitle),
                items: items.length >= 3 ? items : DEFAULT_SECTION_CONTENT.benefits_grid.items,
            }
        }
        case 'process_steps': {
            const stepsRaw = Array.isArray(content.steps) ? content.steps : []
            const steps = stepsRaw
                .map((step) => {
                    const obj = asRecord(step)
                    return {
                        title: asString(obj.title, 'Etapa'),
                        description: asString(obj.description, 'Descrição da etapa.'),
                    }
                })
                .slice(0, 5)

            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.process_steps.title),
                subtitle: asString(content.subtitle, DEFAULT_SECTION_CONTENT.process_steps.subtitle),
                steps: steps.length >= 3 ? steps : DEFAULT_SECTION_CONTENT.process_steps.steps,
            }
        }
        case 'testimonials': {
            const itemsRaw = Array.isArray(content.items) ? content.items : []
            const items = itemsRaw
                .map((item) => {
                    const obj = asRecord(item)
                    return {
                        name: asString(obj.name, 'Cliente Satisfeito'),
                        role: asString(obj.role, 'Cliente'),
                        company: asString(obj.company, 'Empresa'),
                        avatarUrl: asNullableString(obj.avatarUrl, null),
                        quote: asString(obj.quote, 'Excelente experiência.'),
                        rating: normalizeRating(obj.rating),
                    }
                })
                .slice(0, 6)

            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.testimonials.title),
                items: items.length > 0 ? items : DEFAULT_SECTION_CONTENT.testimonials.items,
            }
        }
        case 'faq': {
            const itemsRaw = Array.isArray(content.items) ? content.items : []
            const items = itemsRaw
                .map((item) => {
                    const obj = asRecord(item)
                    return {
                        question: asString(obj.question, 'Pergunta frequente'),
                        answer: asString(obj.answer, 'Resposta da pergunta frequente.'),
                    }
                })
                .slice(0, 8)

            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.faq.title),
                subtitle: asString(content.subtitle, DEFAULT_SECTION_CONTENT.faq.subtitle),
                items: items.length >= 2 ? items : DEFAULT_SECTION_CONTENT.faq.items,
            }
        }
        case 'pricing': {
            const tiersRaw = Array.isArray(content.tiers) ? content.tiers : []
            const tiers = tiersRaw
                .map((tier) => {
                    const obj = asRecord(tier)
                    const features = Array.isArray(obj.features)
                        ? obj.features.map((feature) => asString(feature, '')).filter(Boolean).slice(0, 8)
                        : []

                    return {
                        name: asString(obj.name, 'Plano'),
                        price: asString(obj.price, 'R$ 0'),
                        period: asString(obj.period, '/mês'),
                        description: asString(obj.description, 'Descrição do plano'),
                        features: features.length > 0 ? features : ['Benefício principal'],
                        ctaText: asString(obj.ctaText, 'Escolher plano'),
                        highlighted: asBoolean(obj.highlighted, false),
                    }
                })
                .slice(0, 4)

            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.pricing.title),
                subtitle: asString(content.subtitle, DEFAULT_SECTION_CONTENT.pricing.subtitle),
                tiers: tiers.length > 0 ? tiers : DEFAULT_SECTION_CONTENT.pricing.tiers,
            }
        }
        case 'contact_form': {
            const fieldsRaw = Array.isArray(content.fields) ? content.fields : []
            const allowedFields = ['name', 'email', 'phone', 'company', 'message'] as const
            const fields = fieldsRaw
                .map((field) => asString(field, '').toLowerCase())
                .filter((field): field is typeof allowedFields[number] => allowedFields.includes(field as typeof allowedFields[number]))

            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.contact_form.title),
                subtitle: asString(content.subtitle, DEFAULT_SECTION_CONTENT.contact_form.subtitle),
                fields: fields.length > 0 ? fields : DEFAULT_SECTION_CONTENT.contact_form.fields,
                submitText: asString(content.submitText, DEFAULT_SECTION_CONTENT.contact_form.submitText),
                successMessage: asString(content.successMessage, DEFAULT_SECTION_CONTENT.contact_form.successMessage),
            }
        }
        case 'cta_banner':
            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.cta_banner.title),
                subtitle: asString(content.subtitle, DEFAULT_SECTION_CONTENT.cta_banner.subtitle),
                ctaText: asString(content.ctaText, DEFAULT_SECTION_CONTENT.cta_banner.ctaText),
                ctaUrl: asString(content.ctaUrl, DEFAULT_SECTION_CONTENT.cta_banner.ctaUrl),
            }
        case 'video':
            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.video.title),
                videoUrl: asString(content.videoUrl, DEFAULT_SECTION_CONTENT.video.videoUrl),
                provider: content.provider === 'vimeo' ? 'vimeo' : 'youtube',
            }
        case 'stats': {
            const itemsRaw = Array.isArray(content.items) ? content.items : []
            const items = itemsRaw
                .map((item) => {
                    const obj = asRecord(item)
                    return {
                        value: asString(obj.value, '0'),
                        label: asString(obj.label, 'Métrica'),
                    }
                })
                .slice(0, 6)

            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.stats.title),
                items: items.length >= 2 ? items : DEFAULT_SECTION_CONTENT.stats.items,
            }
        }
        case 'logo_cloud': {
            const logosRaw = Array.isArray(content.logos) ? content.logos : []
            const logos = logosRaw
                .map((item) => {
                    const obj = asRecord(item)
                    return {
                        name: asString(obj.name, 'Marca parceira'),
                        imageUrl: asString(obj.imageUrl, ''),
                    }
                })
                .filter((logo) => logo.imageUrl.length > 0)
                .slice(0, 8)

            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.logo_cloud.title),
                logos,
            }
        }
        case 'gallery': {
            const imagesRaw = Array.isArray(content.images) ? content.images : []
            const images = imagesRaw
                .map((item) => {
                    const obj = asRecord(item)
                    return {
                        url: asString(obj.url, ''),
                        alt: asString(obj.alt, 'Imagem de destaque'),
                    }
                })
                .filter((img) => img.url.length > 0)
                .slice(0, 8)

            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.gallery.title),
                images,
                columns: normalizeColumns(content.columns),
            }
        }
        default:
            return DEFAULT_SECTION_CONTENT.hero
    }
}

function asRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function asString(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

function asNullableString(value: unknown, fallback: string | null): string | null {
    if (value === null) return null
    if (typeof value === 'string') return value
    return fallback
}

function asBoolean(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback
}

function normalizeColumns(value: unknown): 2 | 3 | 4 {
    const num = Number(value)
    if (num === 2 || num === 3 || num === 4) return num
    return 3
}

function normalizeRating(value: unknown): number {
    const num = Number(value)
    if (Number.isNaN(num)) return 5
    return Math.max(1, Math.min(5, Math.round(num)))
}

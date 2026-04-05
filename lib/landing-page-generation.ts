import { generateObject } from 'ai'
import { z } from 'zod'
import { powerModel } from '@/lib/ai'
import { DEFAULT_SECTION_CONTENT, SECTION_LABELS, type SectionType } from '@/domain/entities'
import { inferDesignSystemFromText } from '@/domain/value-objects/design-system'
import type { DesignSystem } from '@/domain/value-objects/design-system'

export interface LandingPageGenerationInput {
    prompt: string
    pageContext?: { name?: string; headline?: string; subheadline?: string }
    productContext?: string
    knowledgeBaseContext?: string
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
    headline: z.string(),
    subheadline: z.string(),
    ctaText: z.string(),
    ctaUrl: z.string().default('#'),
    backgroundImageUrl: z.string().nullable().default(null),
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

const sectionSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('hero'), content: heroContentSchema }),
    z.object({ type: z.literal('features'), content: featuresContentSchema }),
    z.object({ type: z.literal('testimonials'), content: testimonialsContentSchema }),
    z.object({ type: z.literal('faq'), content: faqContentSchema }),
    z.object({ type: z.literal('pricing'), content: pricingContentSchema }),
    z.object({ type: z.literal('contact_form'), content: contactFormContentSchema }),
    z.object({ type: z.literal('cta_banner'), content: ctaBannerContentSchema }),
    z.object({ type: z.literal('video'), content: videoContentSchema }),
    z.object({ type: z.literal('stats'), content: statsContentSchema }),
])

const generateResponseSchema = z.object({
    sections: z.array(sectionSchema).min(2).max(10),
})

const availableSectionTypes = ['hero', 'features', 'testimonials', 'faq', 'pricing', 'contact_form', 'cta_banner', 'video', 'stats'] as const

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
4. Escolha entre 4 e 8 seções, apenas as mais relevantes para o nicho
5. NÃO inclua "logo_cloud" ou "gallery" (precisam de imagens reais)
6. NÃO inclua "video" a menos que o usuário mencione vídeo explicitamente`

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

    const enrichedPrompt = contextParts.length > 0
        ? `${contextParts.join('\n')}\n\nDescrição do negócio/produto/serviço: ${prompt}`
        : `Negócio/produto/serviço: ${prompt}`

    const designSystem = inferDesignSystemFromText(enrichedPrompt)

    let rawSections: Array<{ type: typeof availableSectionTypes[number]; content: Record<string, unknown> }>

    try {
        const { object } = await generateObject({
            model: powerModel,
            schema: generateResponseSchema,
            system: SYSTEM_PROMPT,
            prompt: enrichedPrompt,
            temperature: 0.5,
            maxOutputTokens: 8192,
        })

        rawSections = object.sections.map((s) => ({
            type: s.type as typeof availableSectionTypes[number],
            content: s.content as unknown as Record<string, unknown>,
        }))
    } catch {
        const { object } = await generateObject({
            model: powerModel,
            schema: looseGenerateResponseSchema,
            system: SYSTEM_PROMPT,
            prompt: enrichedPrompt,
            temperature: 0.5,
            maxOutputTokens: 8192,
        })

        rawSections = object.sections
    }

    const sections = normalizeSections(rawSections)
    return { sections, designSystem }
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

    return normalized.slice(0, 10)
}

function normalizeSectionContent(type: SectionType, content: Record<string, unknown>) {
    switch (type) {
        case 'hero':
            return {
                headline: asString(content.headline, DEFAULT_SECTION_CONTENT.hero.headline),
                subheadline: asString(content.subheadline, DEFAULT_SECTION_CONTENT.hero.subheadline),
                ctaText: asString(content.ctaText, DEFAULT_SECTION_CONTENT.hero.ctaText),
                ctaUrl: asString(content.ctaUrl, DEFAULT_SECTION_CONTENT.hero.ctaUrl),
                backgroundImageUrl: asNullableString(content.backgroundImageUrl, DEFAULT_SECTION_CONTENT.hero.backgroundImageUrl),
                alignment: content.alignment === 'left' ? 'left' : 'center',
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

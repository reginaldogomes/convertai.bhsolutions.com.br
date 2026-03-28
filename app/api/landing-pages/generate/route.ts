import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { powerModel } from '@/lib/ai'
import { DEFAULT_SECTION_CONTENT, SECTION_LABELS, type SectionType } from '@/domain/entities'

// --- Zod schemas mirroring LandingPageSection types ---

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

// Section with discriminated union on type
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

O usuário vai descrever um negócio/produto/serviço. Você deve gerar um array de seções otimizado para conversão, com conteúdo REAL, persuasivo e específico ao nicho descrito.

## Seções disponíveis:
${SECTION_LIST}

## Regras gerais:
1. Todo texto DEVE ser em português brasileiro impecável
2. Sempre comece com "hero" — nunca omita
3. Sempre termine com "contact_form" ou "cta_banner"
4. Escolha entre 4 e 8 seções, apenas as mais relevantes para o nicho
5. NÃO inclua "logo_cloud" ou "gallery" (precisam de imagens reais)
6. NÃO inclua "video" a menos que o usuário mencione vídeo explicitamente

## Copywriting — REGRAS CRÍTICAS:

### HERO (obrigatório):
- headline: foco no RESULTADO/BENEFÍCIO principal, não no nome da empresa. Use números quando possível.
  Exemplos ruins: "Bem-vindo à Clínica X" | "Serviços de qualidade"
  Exemplos bons: "Sorriso perfeito em 3 consultas" | "Gestão financeira que dobrou o lucro de +500 PMEs" | "Seu processo seletivo feito em 48h, não 30 dias"
- subheadline: expande a promessa principal, menciona o diferencial, remove a principal objeção
- ctaText: imperativo de ação específico, não genérico. Ex: "Agendar avaliação gratuita" em vez de "Saiba mais"

### FEATURES:
- title de cada item: benefício, não funcionalidade. Ex: "Economize 3 horas por semana" (não "Automação de tarefas")
- description: explica como e por que, com detalhes reais e específicos ao nicho
- icons: escolha somente entre: Zap, Shield, Headphones, Star, Target, Clock, CheckCircle, Globe, Heart, Lightbulb, Rocket, Users

### STATS:
- Use números específicos com contexto: "97%" não "alta taxa"
- value deve incluir sufixo/prefixo quando relevante: "R$1,2M", "+850", "4.9★", "48h"
- label deve explicar o número: "de satisfação dos clientes", "empresas atendidas"

### TESTIMONIALS:
- Crie 3 depoimentos de pessoas reais e verossímeis para o nicho (não use nomes genéricos)
- quote deve mencionar um RESULTADO ESPECÍFICO alcançado, não só elogios vagos
- rating: 4 ou 5 estrelas (nunca menos — isso é para uma boa landing page)
- role e company devem ser coerentes com quem usaria o produto/serviço

### PRICING:
- Crie planos com nomes criativos (não apenas "Básico/Pro/Enterprise")
- Preços em Reais (R$) plausíveis para o nicho
- highlighted: true apenas no plano do meio ou no de maior valor percebido
- features: liste o que mais importa para o decisor da compra (máx. 6 itens por plano)
- ctaText: imperativo específico, ex: "Começar agora", "Falar com especialista"

### FAQ:
- Perguntas que lidam com as OBJEÇÕES REAIS: preço, confiança, diferenciais, tempo, risco
- Respostas honestas que convencem sem serem agressivas
- Mín. 4, máx. 7 perguntas

### CONTACT_FORM:
- title: convite à ação, não apenas "Fale conosco". Ex: "Pronto para transformar seu sorriso?"
- subtitle: reforça a proposta de valor, menciona tempo de resposta
- fields: inclua sempre "name" e "email". Adicione "phone" para nichos que ligarão de volta (clínicas, imóveis, consultoria). Adicione "message" apenas se for realmente necessário
- submitText: imperativo específico, não "Enviar"

### CTA_BANNER (alternativa ao contact_form):
- title: frase de impacto com urgência ou benefício claro
- subtitle: detalhe o que acontece após o clique
- ctaText: call to action específico e motivador

## Adaptação por nicho:
- Clínicas/saúde: tom acolhedor e profissional, foco em confiança e resultados
- SaaS/tecnologia: tom direto e eficiente, foco em ROI e economia de tempo
- Educação/cursos: tom inspirador, foco em transformação e carreira
- Varejo/e-commerce: tom descontraído e irresistível, foco em economia e exclusividade  
- Consultoria/B2B: tom estratégico e sofisticado, foco em resultados mensuráveis
- Imóveis: tom aspiracional, foco em investimento e qualidade de vida`

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { prompt } = body as { prompt?: string }

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
            return NextResponse.json(
                { error: 'Descrição muito curta. Descreva o negócio com pelo menos 10 caracteres.' },
                { status: 400 }
            )
        }

        const { object } = await generateObject({
            model: powerModel,
            schema: looseGenerateResponseSchema,
            system: SYSTEM_PROMPT,
            prompt: `Negócio/produto/serviço: ${prompt.trim()}`,
            temperature: 0.8,
            maxTokens: 4096,
        })

        const normalizedSections = normalizeSections(object.sections)
        const parsed = generateResponseSchema.safeParse({ sections: normalizedSections })
        if (!parsed.success) {
            const fallbackSections = [
                { type: 'hero' as const, content: DEFAULT_SECTION_CONTENT.hero },
                { type: 'features' as const, content: DEFAULT_SECTION_CONTENT.features },
                { type: 'cta_banner' as const, content: DEFAULT_SECTION_CONTENT.cta_banner },
            ]

            const sections = fallbackSections.map((section, idx) => ({
                id: crypto.randomUUID(),
                ...section,
                order: idx,
                visible: true,
            }))

            return NextResponse.json({ sections })
        }

        // Add id, order, visible to each section
        const sections = parsed.data.sections.map((section, idx) => ({
            id: crypto.randomUUID(),
            ...section,
            order: idx,
            visible: true,
        }))

        return NextResponse.json({ sections })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao gerar landing page'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

function normalizeSections(sections: Array<{ type: typeof availableSectionTypes[number]; content: Record<string, unknown> }>) {
    const normalized = sections.map((section) => ({
        type: section.type,
        content: normalizeSectionContent(section.type, section.content),
    }))

    const hasHero = normalized.some(section => section.type === 'hero')
    if (!hasHero) {
        normalized.unshift({ type: 'hero', content: DEFAULT_SECTION_CONTENT.hero })
    }

    if (normalized[0]?.type !== 'hero') {
        const heroIndex = normalized.findIndex(section => section.type === 'hero')
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
                        ? obj.features.map(feature => asString(feature, '')).filter(Boolean).slice(0, 8)
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
                .map(field => asString(field, '').toLowerCase())
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

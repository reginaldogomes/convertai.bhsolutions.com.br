import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { powerModel } from '@/lib/ai'
import { SECTION_LABELS } from '@/domain/entities'

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
    icon: z.enum(['Zap', 'Shield', 'HeadphonesIcon', 'Star', 'Target', 'Clock', 'CheckCircle', 'Globe', 'Heart', 'Lightbulb', 'Rocket', 'Users']),
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

const SECTION_LIST = Object.entries(SECTION_LABELS)
    .map(([key, label]) => `- "${key}": ${label}`)
    .join('\n')

const SYSTEM_PROMPT = `Você é um especialista em criação de landing pages de alta conversão para o mercado brasileiro.

O usuário vai descrever um negócio/produto/serviço. Você deve gerar um array de seções otimizado para conversão.

## Seções disponíveis:
${SECTION_LIST}

## Regras:
1. Todo texto DEVE ser em português brasileiro
2. Sempre comece com "hero" e termine com "contact_form" ou "cta_banner"
3. Escolha entre 4 e 8 seções, as mais relevantes para o nicho descrito
4. Gere conteúdo realista e persuasivo — não use "Lorem ipsum"
5. Para "testimonials", crie nomes e depoimentos fictícios mas verossímeis
6. Para "pricing", crie preços em Reais (R$) com valores plausíveis para o nicho
7. Para "stats", use números impressionantes mas realistas
8. Para "features", escolha ícones relevantes dentre: Zap, Shield, HeadphonesIcon, Star, Target, Clock, CheckCircle, Globe, Heart, Lightbulb, Rocket, Users
9. Para "faq", gere perguntas que um lead real teria sobre o negócio
10. NÃO inclua "logo_cloud" ou "gallery" (estes precisam de imagens reais)
11. NÃO inclua "video" a menos que o usuário mencione vídeo
12. Adapte a linguagem e tom ao perfil do público-alvo`

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
            schema: generateResponseSchema,
            system: SYSTEM_PROMPT,
            prompt: prompt.trim(),
            temperature: 0.7,
        })

        // Add id, order, visible to each section
        const sections = object.sections.map((section, idx) => ({
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

import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { getAuthContext } from '@/infrastructure/auth'
import { agentModel } from '@/lib/ai'
import { ragService, useCases } from '@/application/services/container'
import { createApiRequestLogger, isAuthError, jsonWithRequestId } from '@/lib/api-observability'
import type { RagSearchFilters } from '@/domain/interfaces'

const schema = z.object({
    title: z.string().min(10).max(70),
    description: z.string().min(40).max(170),
    keywords: z.array(z.string().min(2).max(32)).min(5).max(12),
    ogTitle: z.string().min(10).max(70),
    ogDescription: z.string().min(40).max(200),
})

const system = `Você é um especialista em SEO técnico e copywriting para landing pages em português do Brasil.

Objetivo:
- Gerar metadados de alta conversão e alto CTR para Google e redes sociais.

Regras:
- Escreva em pt-BR.
- Título SEO entre 50 e 65 caracteres, claro e orientado a benefício.
- Meta description entre 140 e 160 caracteres, com proposta de valor concreta e CTA leve.
- Keywords devem ser relevantes, sem spam, sem repetição e sem termos genéricos vazios.
- OG title/description podem variar para social, mantendo consistência com a oferta.
- Não use clickbait enganoso.
- Evite aspas desnecessárias e excesso de pontuação.`

function extractIntentKeywords(input: string): string[] {
    const stopwords = new Set([
        'para', 'com', 'sem', 'uma', 'uns', 'umas', 'dos', 'das', 'por', 'que', 'como', 'mais', 'menos', 'sobre',
        'de', 'do', 'da', 'e', 'o', 'a', 'os', 'as', 'em', 'no', 'na', 'nos', 'nas', 'um', 'ao', 'aos',
    ])

    return Array.from(new Set(
        input
            .toLowerCase()
            .split(/[^a-z0-9áàâãéèêíïóôõöúçñ]+/i)
            .map((token) => token.trim())
            .filter((token) => token.length >= 4 && !stopwords.has(token))
    )).slice(0, 12)
}

export async function POST(req: NextRequest) {
    const logger = createApiRequestLogger('landing-pages/seo/generate')

    try {
        logger.log('request_received')
        const { orgId } = await getAuthContext()

        const body = await req.json() as { pageId?: string; focusNiche?: string; focusLocale?: string }
        const pageId = body.pageId
        const focusNiche = (body.focusNiche || '').trim().slice(0, 140)
        const focusLocale = (body.focusLocale || '').trim().slice(0, 140)

        if (!pageId) {
            return jsonWithRequestId(logger.requestId, { error: 'pageId é obrigatório', requestId: logger.requestId }, { status: 400 })
        }

        const pageResult = await useCases.getLandingPage().execute(orgId, pageId)
        if (!pageResult.ok) {
            return jsonWithRequestId(
                logger.requestId,
                { error: pageResult.error.message, requestId: logger.requestId },
                { status: 404 }
            )
        }

        const page = pageResult.value
        let productName = ''
        let targetAudience = ''

        if (page.productId) {
            const productResult = await useCases.getProduct().execute(orgId, page.productId)
            if (productResult.ok) {
                productName = productResult.value.name
                targetAudience = productResult.value.targetAudience || ''
            }
        }

        const intentKeywords = extractIntentKeywords([
            page.name,
            page.headline,
            page.subheadline,
            page.ctaText,
            productName,
            targetAudience,
            focusNiche,
            focusLocale,
        ].filter(Boolean).join(' '))

        const ragFilters: RagSearchFilters = {
            brandName: page.name,
            niche: focusNiche || productName || undefined,
            targetAudience: targetAudience || undefined,
            locale: focusLocale || undefined,
            intentKeywords,
        }

        const ragMatches = await ragService.search(
            `${page.name}. ${page.headline}. ${page.subheadline}. ${page.ctaText}`,
            orgId,
            undefined,
            ragFilters,
        )

        const ragContext = ragMatches
            .slice(0, 5)
            .map((doc, index) => {
                const metadata = doc.metadataJson && Object.keys(doc.metadataJson).length > 0
                    ? `\nmetadata: ${JSON.stringify(doc.metadataJson)}`
                    : ''
                return `[${index + 1}] ${doc.title}\n${doc.content}${metadata}`
            })
            .join('\n\n---\n\n')

        const sections = page.configJson.sections ?? []
        const sectionSummary = sections
            .slice(0, 8)
            .map((section, index) => {
                const content = JSON.stringify(section.content ?? {})
                const compact = content.replace(/\s+/g, ' ').trim()
                const text = compact.length > 280 ? `${compact.slice(0, 280)}...` : compact
                return `${index + 1}. ${section.type}: ${text}`
            })
            .join('\n')

        const prompt = [
            `Landing page: ${page.name}`,
            `Slug: ${page.slug}`,
            `Headline: ${page.headline}`,
            `Subheadline: ${page.subheadline}`,
            `CTA: ${page.ctaText}`,
            (focusNiche || productName) ? `Nicho principal: ${focusNiche || productName}` : '',
            focusLocale ? `Localidade foco: ${focusLocale}` : '',
            targetAudience ? `Publico alvo: ${targetAudience}` : '',
            intentKeywords.length > 0 ? `Keywords de intencao: ${intentKeywords.join(', ')}` : '',
            '',
            'Resumo das seções:',
            sectionSummary || 'Sem seções relevantes.',
            '',
            'Contexto RAG (priorize termos, dores e beneficios reais):',
            ragContext || 'Sem contexto RAG disponivel.',
            '',
            'Gere metatags SEO completas para esta landing page.',
        ].join('\n')

        try {
            const { object } = await generateObject({
                model: agentModel,
                schema,
                system,
                prompt,
                temperature: 0.35,
                maxOutputTokens: 800,
            })

            logger.log('seo_generated', { keywordsCount: object.keywords.length })
            return jsonWithRequestId(logger.requestId, { ...object, requestId: logger.requestId })
        } catch (aiError) {
            const fallback = buildFallbackSeo(page)
            logger.error('seo_fallback_used', aiError)
            return jsonWithRequestId(logger.requestId, {
                ...fallback,
                requestId: logger.requestId,
                warning: aiError instanceof Error ? aiError.message : 'IA indisponível. Resultado fallback aplicado.',
            })
        }
    } catch (error) {
        logger.error('request_failed', error)

        if (isAuthError(error)) {
            return jsonWithRequestId(logger.requestId, { error: 'Não autenticado', requestId: logger.requestId }, { status: 401 })
        }

        return jsonWithRequestId(logger.requestId, { error: 'Erro ao gerar SEO com IA', requestId: logger.requestId }, { status: 500 })
    }
}

function buildFallbackSeo(page: {
    name: string
    headline: string
    subheadline: string
    ctaText: string
    slug: string
}) {
    const baseTitle = (page.headline || page.name || '').trim()
    const title = truncate(baseTitle.length > 0 ? `${baseTitle} | Solução com IA` : `Landing ${page.slug} | Solução com IA`, 65)

    const descriptionSource = (page.subheadline || `Descubra ${page.name} com foco em resultado e implementação prática.`).trim()
    const description = truncate(
        `${descriptionSource} Fale com nosso time e veja como aplicar na sua operação.`,
        160
    )

    const ogTitle = truncate(`${baseTitle || page.name} - Conheça agora`, 65)
    const ogDescription = truncate(description, 190)

    const keywords = buildKeywordList([page.name, page.headline, page.subheadline, page.ctaText, 'inteligencia artificial', 'automacao'])

    return {
        title,
        description,
        keywords,
        ogTitle,
        ogDescription,
    }
}

function buildKeywordList(values: string[]): string[] {
    const keywords = new Set<string>()

    for (const value of values) {
        const normalized = (value || '').toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ')
        for (const token of normalized.split(/\s+/)) {
            const word = token.trim()
            if (word.length < 3) continue
            keywords.add(word)
            if (keywords.size >= 10) return Array.from(keywords)
        }
    }

    return Array.from(keywords)
}

function truncate(value: string, limit: number): string {
    const text = value.trim()
    if (text.length <= limit) return text
    return `${text.slice(0, limit - 1).trimEnd()}…`
}

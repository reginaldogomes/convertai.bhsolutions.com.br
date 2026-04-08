import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { getAuthContext } from '@/infrastructure/auth'
import { agentModel } from '@/lib/ai'
import { useCases } from '@/application/services/container'
import { NotAuthenticatedError, OrganizationNotFoundError } from '@/domain/errors'

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

export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID()

    try {
        const { orgId } = await getAuthContext()

        const body = await req.json() as { pageId?: string }
        const pageId = body.pageId

        if (!pageId) {
            return NextResponse.json({ error: 'pageId é obrigatório' }, { status: 400 })
        }

        const pageResult = await useCases.getLandingPage().execute(orgId, pageId)
        if (!pageResult.ok) {
            return NextResponse.json({ error: pageResult.error.message }, { status: 404 })
        }

        const page = pageResult.value
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
            '',
            'Resumo das seções:',
            sectionSummary || 'Sem seções relevantes.',
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

            return NextResponse.json({ ...object, requestId })
        } catch (aiError) {
            const fallback = buildFallbackSeo(page)
            return NextResponse.json({
                ...fallback,
                requestId,
                warning: aiError instanceof Error ? aiError.message : 'IA indisponível. Resultado fallback aplicado.',
            })
        }
    } catch (error) {
        if (error instanceof NotAuthenticatedError || error instanceof OrganizationNotFoundError) {
            return NextResponse.json(
                { error: 'Não autenticado', requestId },
                { status: 401 }
            )
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erro ao gerar SEO com IA', requestId },
            { status: 500 }
        )
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

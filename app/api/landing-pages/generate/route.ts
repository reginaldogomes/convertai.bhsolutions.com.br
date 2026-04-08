import { NextResponse } from 'next/server'
import { getAuthContext } from '@/infrastructure/auth'
import { generateLandingPageSections } from '@/lib/landing-page-generation'
import { useCases, ragService } from '@/application/services/container'
import { createApiRequestLogger, isAuthError, jsonWithRequestId } from '@/lib/api-observability'
import { enforceAiUsagePolicy, recordAiUsageEvent, estimateCostCents } from '@/lib/ai-governance'
import type { RagSearchFilters } from '@/domain/interfaces'

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
    )).slice(0, 10)
}

export async function POST(request: Request) {
    const logger = createApiRequestLogger('landing-pages/generate')
    let usageContext: { organizationId: string; userId: string; requestId: string; routeScope: string; featureKey: string; model: string; provider: 'google' } | null = null
    let requestInputChars = 0
    const startedAt = Date.now()

    try {
        logger.log('request_received')
        const { orgId, userId } = await getAuthContext()

        const body = await request.json()
        const { prompt, pageContext, productContext, productId, imageGeneration } = body as {
            prompt?: string
            pageContext?: { name?: string; headline?: string; subheadline?: string }
            productContext?: string
            productId?: string
            imageGeneration?: {
                enabled?: boolean
                model?: 'gemini-2.5-flash-image' | 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview'
            }
        }

        usageContext = {
            organizationId: orgId,
            userId,
            requestId: logger.requestId,
            routeScope: 'landing-pages/generate',
            featureKey: 'landing_page_sections',
            model: 'gemini-2.5-pro',
            provider: 'google',
        }

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
            return jsonWithRequestId(
                logger.requestId,
                { error: 'Descrição muito curta. Descreva o negócio com pelo menos 10 caracteres.', requestId: logger.requestId },
                { status: 400 }
            )
        }

        let resolvedProductContext = productContext
        let knowledgeBaseContext = ''

        const ragFilters: RagSearchFilters = {
            brandName: pageContext?.name,
            intentKeywords: extractIntentKeywords(prompt),
        }

        let productNameForSeo = ''
        let productAudienceForSeo = ''

        if (productId) {
            const productResult = await useCases.getProduct().execute(orgId, productId)
            if (productResult.ok) {
                const product = productResult.value
                productNameForSeo = product.name
                productAudienceForSeo = product.targetAudience ?? ''

                if (!resolvedProductContext) {
                    resolvedProductContext = product.toAIContext()
                }

                ragFilters.niche = product.name
                ragFilters.targetAudience = product.targetAudience ?? undefined

                // RAG retrieval over org knowledge base, then prioritize docs related to selected product.
                const ragMatches = await ragService.search(prompt, orgId, undefined, ragFilters)
                const productName = product.name.toLowerCase()
                const relatedMatches = ragMatches.filter((match) => {
                    const title = match.title.toLowerCase()
                    const content = match.content.toLowerCase()
                    return title.includes(productName) || content.includes(productName)
                })

                const prioritized = (relatedMatches.length > 0 ? relatedMatches : ragMatches).slice(0, 5)
                if (prioritized.length > 0) {
                    knowledgeBaseContext = prioritized
                        .map((doc, index) => `[${index + 1}] ${doc.title}\n${doc.content}`)
                        .join('\n\n---\n\n')
                }
            }
        } else {
            const ragMatches = await ragService.search(prompt, orgId, undefined, ragFilters)
            const prioritized = ragMatches.slice(0, 5)
            if (prioritized.length > 0) {
                knowledgeBaseContext = prioritized
                    .map((doc, index) => `[${index + 1}] ${doc.title}\n${doc.content}`)
                    .join('\n\n---\n\n')
            }
        }

        requestInputChars = [
            prompt,
            pageContext?.name,
            pageContext?.headline,
            pageContext?.subheadline,
            resolvedProductContext,
            knowledgeBaseContext,
        ].filter(Boolean).join('\n').length

        const guard = await enforceAiUsagePolicy(usageContext)
        if (!guard.allowed) {
            await recordAiUsageEvent(usageContext, {
                status: 'blocked',
                inputChars: requestInputChars,
                errorCode: guard.status === 429 ? 'daily_limit_reached' : 'monthly_budget_reached',
            })

            return jsonWithRequestId(
                logger.requestId,
                {
                    error: guard.error,
                    requestId: logger.requestId,
                    limits: {
                        dailyRequestsLimit: guard.policy.dailyRequestsLimit,
                        monthlyBudgetCents: guard.policy.monthlyBudgetCents,
                    },
                },
                { status: guard.status }
            )
        }

        const generated = await generateLandingPageSections({
            prompt,
            pageContext,
            productContext: resolvedProductContext,
            knowledgeBaseContext,
            seoContext: {
                primaryTopic: productNameForSeo || pageContext?.name || undefined,
                targetAudience: productAudienceForSeo || undefined,
                intentKeywords: ragFilters.intentKeywords,
            },
            imageGeneration,
        })

        const sections = generated.sections.map((section, idx) => ({
            id: crypto.randomUUID(),
            ...section,
            order: idx,
            visible: true,
        }))

        const outputChars = JSON.stringify(sections).length + JSON.stringify(generated.designSystem).length
        const estimatedCostCents = estimateCostCents('gemini-2.5-pro', requestInputChars, outputChars)

        await recordAiUsageEvent(usageContext, {
            status: 'success',
            inputChars: requestInputChars,
            outputChars,
            estimatedCostCents,
            durationMs: Date.now() - startedAt,
            metadata: {
                hasProductId: Boolean(productId),
                imageGenerationEnabled: Boolean(imageGeneration?.enabled),
            },
        })

        logger.log('generation_succeeded', {
            sectionsCount: sections.length,
            hasProductId: Boolean(productId),
        })

        return jsonWithRequestId(logger.requestId, { sections, designSystem: generated.designSystem })
    } catch (error) {
        logger.error('generation_failed', error)

        if (usageContext) {
            await recordAiUsageEvent(usageContext, {
                status: 'error',
                inputChars: requestInputChars,
                durationMs: Date.now() - startedAt,
                errorCode: 'generation_failed',
            })
        }

        if (isAuthError(error)) {
            return jsonWithRequestId(logger.requestId, { error: 'Não autenticado', requestId: logger.requestId }, { status: 401 })
        }

        return jsonWithRequestId(logger.requestId, { error: 'Erro ao gerar landing page', requestId: logger.requestId }, { status: 500 })
    }
}

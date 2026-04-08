import { NextResponse } from 'next/server'
import { getAuthContext } from '@/infrastructure/auth'
import { generateLandingPageSections } from '@/lib/landing-page-generation'
import { useCases, ragService } from '@/application/services/container'
import { createApiRequestLogger, isAuthError, jsonWithRequestId } from '@/lib/api-observability'

export async function POST(request: Request) {
    const logger = createApiRequestLogger('landing-pages/generate')

    try {
        logger.log('request_received')
        const { orgId } = await getAuthContext()

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

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
            return jsonWithRequestId(
                logger.requestId,
                { error: 'Descrição muito curta. Descreva o negócio com pelo menos 10 caracteres.', requestId: logger.requestId },
                { status: 400 }
            )
        }

        let resolvedProductContext = productContext
        let knowledgeBaseContext = ''

        if (productId) {
            const productResult = await useCases.getProduct().execute(orgId, productId)
            if (productResult.ok) {
                const product = productResult.value
                if (!resolvedProductContext) {
                    resolvedProductContext = product.toAIContext()
                }

                // RAG retrieval over org knowledge base, then prioritize docs related to selected product.
                const ragMatches = await ragService.search(prompt, orgId)
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
        }

        const generated = await generateLandingPageSections({
            prompt,
            pageContext,
            productContext: resolvedProductContext,
            knowledgeBaseContext,
            imageGeneration,
        })

        const sections = generated.sections.map((section, idx) => ({
            id: crypto.randomUUID(),
            ...section,
            order: idx,
            visible: true,
        }))

        logger.log('generation_succeeded', {
            sectionsCount: sections.length,
            hasProductId: Boolean(productId),
        })

        return jsonWithRequestId(logger.requestId, { sections, designSystem: generated.designSystem })
    } catch (error) {
        logger.error('generation_failed', error)

        if (isAuthError(error)) {
            return jsonWithRequestId(logger.requestId, { error: 'Não autenticado', requestId: logger.requestId }, { status: 401 })
        }

        return jsonWithRequestId(logger.requestId, { error: 'Erro ao gerar landing page', requestId: logger.requestId }, { status: 500 })
    }
}

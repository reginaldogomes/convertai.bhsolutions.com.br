import { NextResponse } from 'next/server'
import { getAuthContext } from '@/infrastructure/auth'
import { generateLandingPageSections } from '@/lib/landing-page-generation'
import { useCases, ragService } from '@/application/services/container'

export async function POST(request: Request) {
    try {
        const { orgId } = await getAuthContext()

        const body = await request.json()
        const { prompt, pageContext, productContext, productId } = body as {
            prompt?: string
            pageContext?: { name?: string; headline?: string; subheadline?: string }
            productContext?: string
            productId?: string
        }

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
            return NextResponse.json(
                { error: 'Descrição muito curta. Descreva o negócio com pelo menos 10 caracteres.' },
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
        })

        const sections = generated.sections.map((section, idx) => ({
            id: crypto.randomUUID(),
            ...section,
            order: idx,
            visible: true,
        }))

        return NextResponse.json({ sections, designSystem: generated.designSystem })
    } catch (error) {
        console.error('[generate] FATAL:', error)
        const message = error instanceof Error ? error.message : 'Erro ao gerar landing page'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

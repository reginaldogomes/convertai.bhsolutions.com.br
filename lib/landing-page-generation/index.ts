import { generateObject } from 'ai'
import { structuredOutputModel } from '@/lib/ai'
import { inferDesignSystemFromText } from '@/domain/value-objects/design-system'
import type { LandingPageGenerationInput, LandingPageGenerationOutput } from './types'
import { generateResponseSchema, looseGenerateResponseSchema, availableSectionTypes } from './schemas'
import { SYSTEM_PROMPT } from './prompts'
import { normalizeSections, buildSafeFallbackSections } from './normalization'
import { enrichSectionsWithImages } from './visuals'

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

    if (input.seoContext) {
        const seoHints: string[] = []
        if (input.seoContext.primaryTopic) seoHints.push(`Tópico principal para SEO: ${input.seoContext.primaryTopic}`)
        if (input.seoContext.targetAudience) seoHints.push(`Público-alvo principal: ${input.seoContext.targetAudience}`)
        if (input.seoContext.locale) seoHints.push(`Localidade prioritária: ${input.seoContext.locale}`)
        if (input.seoContext.intentKeywords && input.seoContext.intentKeywords.length > 0) {
            seoHints.push(`Palavras-chave de intenção: ${input.seoContext.intentKeywords.slice(0, 10).join(', ')}`)
        }

        if (seoHints.length > 0) {
            contextParts.push('Diretrizes de indexação orgânica: use as palavras-chave de forma natural em headlines/subheadlines/FAQ, sem keyword stuffing, com foco em clareza e intenção de busca.')
            contextParts.push(seoHints.join('\n'))
        }
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
            model: structuredOutputModel,
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
    } catch (strictError) {
        console.warn('[landing-generation] strict schema failed, trying loose schema', {
            message: strictError instanceof Error ? strictError.message : 'unknown error',
        })

        try {
            const { object } = await generateObject({
                model: structuredOutputModel,
                schema: looseGenerateResponseSchema,
                system: SYSTEM_PROMPT,
                prompt: enrichedPrompt,
                temperature: 0.4,
                maxOutputTokens: 4096,
            })

            rawSections = object.sections
        } catch (looseError) {
            console.error('[landing-generation] loose schema failed, using safe fallback sections', {
                strictError: strictError instanceof Error ? strictError.message : 'unknown error',
                looseError: looseError instanceof Error ? looseError.message : 'unknown error',
            })

            rawSections = buildSafeFallbackSections(input)
        }
    }

    const sections = normalizeSections(rawSections)
    const sectionsWithVisuals = await enrichSectionsWithImages(sections, input)
    return { sections: sectionsWithVisuals, designSystem }
}

export * from './types'

'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases, ragService } from '@/application/services/container'
import { getErrorMessage } from '../utils'
import type { LandingPageSection, SectionType } from '@/domain/entities'
import { DEFAULT_DESIGN_SYSTEM } from '@/domain/value-objects/design-system'
import { generateLandingPageSections } from '@/lib/landing-page-generation'
import type { Product } from '@/domain/entities/product'
import type { RagSearchFilters } from '@/domain/interfaces'
import { applyHeroPreset, anchorSectionsWithProductData, isColorDark } from './utils'

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

export async function createLandingPage(prevState: { error: string; success: boolean }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()

        // Parse design system from form if provided, otherwise use default
        let designSystem = DEFAULT_DESIGN_SYSTEM
        const designSystemRaw = formData.get('designSystem') as string | null
        if (designSystemRaw) {
            try {
                designSystem = JSON.parse(designSystemRaw)
            } catch {
                // Invalid JSON — use default
            }
        }

        const bg = designSystem.palette?.background ?? ''
        const isDark = isColorDark(bg)

        const productId = (formData.get('productId') as string) || null
        const heroLayoutPreset = (formData.get('heroLayoutPreset') as string) || 'central'
        const generateVisuals = (formData.get('generateVisuals') as string) === '1'
        const imageModel = (formData.get('imageModel') as string) || 'gemini-2.5-flash-image'
        const aiPrompt = ((formData.get('aiPrompt') as string) || '').trim()
        let linkedProduct: Product | null = null

        // Parse AI-generated sections if present
        let sections: LandingPageSection[] = []
        const sectionsRaw = formData.get('sectionsJson') as string | null
        if (sectionsRaw) {
            try {
                const parsed = JSON.parse(sectionsRaw)
                if (Array.isArray(parsed)) {
                    sections = parsed.map((s: Record<string, unknown>, i: number) => ({
                        id: crypto.randomUUID(),
                        type: s.type as SectionType,
                        order: i,
                        visible: true,
                        content: s.content as Record<string, unknown>,
                    })) as unknown as LandingPageSection[]
                }
            } catch { /* ignore invalid JSON */ }
        }

        if (productId) {
            const productResult = await useCases.getProduct().execute(orgId, productId)
            if (!productResult.ok) {
                throw new Error('Produto selecionado não encontrado para gerar a landing page')
            }
            linkedProduct = productResult.value
        }

        // Server-side fallback generation when client payload is missing or omitted due to size limits.
        if (sections.length === 0 && (linkedProduct || aiPrompt.length >= 10)) {
            const productContext = linkedProduct ? linkedProduct.toAIContext() : undefined

            const promptFromForm = [
                (formData.get('headline') as string) || '',
                (formData.get('subheadline') as string) || '',
                (formData.get('name') as string) || '',
            ].filter(Boolean).join('. ').trim()

            const productFallbackPrompt = linkedProduct
                ? [
                    linkedProduct.name,
                    linkedProduct.shortDescription,
                    linkedProduct.targetAudience ? `Público-alvo: ${linkedProduct.targetAudience}` : '',
                    linkedProduct.differentials ? `Diferenciais: ${linkedProduct.differentials}` : '',
                ].filter(Boolean).join('. ')
                : ''

            const generationPrompt = aiPrompt.length >= 10
                ? aiPrompt
                : promptFromForm.length > 0
                ? promptFromForm
                : productFallbackPrompt
            
            let knowledgeBaseContext = ''
            const ragFilters: RagSearchFilters = {
                brandName: (formData.get('name') as string) || linkedProduct?.name || undefined,
                niche: linkedProduct?.name || undefined,
                targetAudience: linkedProduct?.targetAudience || undefined,
                intentKeywords: extractIntentKeywords(generationPrompt),
            }
            
            // Metadata para entradas de KB geradas a partir do contexto do produto/LP
            const generatedMetadata = {
                source: 'landing_page_generation',
                generatedFrom: linkedProduct ? 'product_context' : 'ai_prompt',
                updatedAt: new Date().toISOString(),
            }
            
            const ragMatches = await ragService.search(generationPrompt, orgId, undefined, ragFilters)
            const prioritizedMatches = linkedProduct
                ? (() => {
                    const productName = linkedProduct.name.toLowerCase()
                    const relatedMatches = ragMatches.filter((match) => {
                        const title = match.title.toLowerCase()
                        const content = match.content.toLowerCase()
                        return title.includes(productName) || content.includes(productName)
                    })
                    return (relatedMatches.length > 0 ? relatedMatches : ragMatches).slice(0, 5)
                })()
                : ragMatches.slice(0, 5)

            if (prioritizedMatches.length > 0) {
                knowledgeBaseContext = prioritizedMatches 
                    .map((doc, index) => `[${index + 1}] ${doc.title}\n${doc.content}`)
                    .join('\n\n---\n\n')
            }

            const generated = await generateLandingPageSections({
                prompt: generationPrompt,
                pageContext: {
                    name: (formData.get('name') as string) || linkedProduct?.name,
                    headline: (formData.get('headline') as string) || linkedProduct?.name,
                    subheadline: (formData.get('subheadline') as string) || linkedProduct?.shortDescription,
                },
                productContext,
                knowledgeBaseContext,
                seoContext: {
                    primaryTopic: linkedProduct?.name || (formData.get('name') as string) || undefined,
                    targetAudience: linkedProduct?.targetAudience || undefined,
                    intentKeywords: ragFilters.intentKeywords,
                },
                imageGeneration: {
                    enabled: generateVisuals,
                    model: imageModel as 'gemini-2.5-flash-image' | 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview',
                },
            })

            sections = generated.sections.map((s, i) => ({
                id: crypto.randomUUID(),
                type: s.type as SectionType,
                order: i,
                visible: true,
                content: s.content,
            })) as unknown as LandingPageSection[]

            if (linkedProduct) {
                await useCases.addKnowledgeBase().execute(orgId, {
                    title: `Contexto de Geração para LP: ${linkedProduct.name}`,
                    content: productContext || generationPrompt,
                    metadata: { ...generatedMetadata, entryType: 'product_context_for_lp', productId: linkedProduct.id }
                })
                sections = anchorSectionsWithProductData(linkedProduct, sections)
            }

            designSystem = generated.designSystem
        }

        if (linkedProduct && sections.length > 0) {
            sections = anchorSectionsWithProductData(linkedProduct, sections)
        }

        if (productId && sections.length === 0) {
            throw new Error('Cannot create landing page without AI-generated sections for selected product')
        }

        if (sections.length > 0) {
            sections = applyHeroPreset(sections, heroLayoutPreset)
        }

        const generatedDesignSystemRaw = formData.get('generatedDesignSystem') as string | null
        if (generatedDesignSystemRaw) {
            try {
                const genDS = JSON.parse(generatedDesignSystemRaw)
                if (genDS?.palette) designSystem = genDS
            } catch { /* ignore */ }
        }

        const result = await useCases.createLandingPage().execute(orgId, {
            name: formData.get('name') as string,
            slug: formData.get('slug') as string,
            productId,
            headline: (formData.get('headline') as string) || '',
            subheadline: (formData.get('subheadline') as string) || '',
            ctaText: (formData.get('ctaText') as string) || 'Fale conosco',
            chatbotName: (formData.get('chatbotName') as string) || 'Assistente',
            chatbotWelcomeMessage: (formData.get('chatbotWelcomeMessage') as string) || 'Olá! Como posso ajudar?',
            chatbotSystemPrompt: (formData.get('chatbotSystemPrompt') as string) || '',
            configJson: {
                theme: isDark ? 'dark' : 'light',
                primaryColor: designSystem.palette?.primary ?? '#6366f1',
                designSystem,
                logoUrl: null,
                sections,
            },
        })

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/landing-pages')
        revalidatePath(`/p/${result.value.slug}`)
        revalidatePath('/sitemap.xml')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

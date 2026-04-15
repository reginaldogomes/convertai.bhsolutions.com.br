'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases, ragService } from '@/application/services/container'
import { getErrorMessage } from './utils'
import { canDo } from '@/lib/permissions'
import type { LandingPageSection, SectionType } from '@/domain/entities'
import type { DesignSystem } from '@/domain/value-objects/design-system'
import { DEFAULT_DESIGN_SYSTEM } from '@/domain/value-objects/design-system'
import { generateLandingPageSections } from '@/lib/landing-page-generation'
import type { Product } from '@/domain/entities/product'
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
                sections = anchorSectionsWithProductData(linkedProduct, sections)
            }

            designSystem = generated.designSystem
        }

        // If sections already came from client, still enforce product-anchored copy server-side.
        if (linkedProduct && sections.length > 0) {
            sections = anchorSectionsWithProductData(linkedProduct, sections)
        }

        // Strict non-bypassable guardrail.
        if (productId && sections.length === 0) {
            throw new Error('Cannot create landing page without AI-generated sections for selected product')
        }

        // Apply the user-selected hero layout preset to all hero sections.
        if (sections.length > 0) {
            sections = applyHeroPreset(sections, heroLayoutPreset)
        }

        // Use AI-generated design system if available
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

function applyHeroPreset(sections: LandingPageSection[], preset: string): LandingPageSection[] {
    const presets: Record<string, { layout: 'background' | 'split'; alignment: 'center' | 'left' }> = {
        central:   { layout: 'background', alignment: 'center' },
        split:     { layout: 'split',      alignment: 'left'   },
        immersive: { layout: 'background', alignment: 'center' },
        minimal:   { layout: 'background', alignment: 'left'   },
    }
    const config = presets[preset] ?? presets.central
    return sections.map((section) => {
        if (section.type !== 'hero') return section
        const content = { ...(section.content as unknown as Record<string, unknown>) }
        content.layout = config.layout
        content.alignment = config.alignment
        // For the immersive preset, ensure heroImageUrl (if set) moves to backgroundImageUrl
        if (preset === 'immersive') {
            const heroImg = (content.heroImageUrl as string | null) || null
            const bgImg = (content.backgroundImageUrl as string | null) || null
            if (!bgImg && heroImg) {
                content.backgroundImageUrl = heroImg
                content.heroImageUrl = null
            }
        }
        return { ...section, content: content as unknown as LandingPageSection['content'] }
    })
}

function anchorSectionsWithProductData(product: Product, sections: LandingPageSection[]): LandingPageSection[] {
    const cloned = sections.map((section) => ({
        ...section,
        content: { ...section.content } as LandingPageSection['content'],
    }))

    for (const section of cloned) {
        if (section.type === 'hero') {
            const content = section.content as unknown as Record<string, unknown>
            const headline = String(content.headline ?? '').trim()
            const subheadline = String(content.subheadline ?? '').trim()

            if (!headline || isGenericCopy(headline) || !headline.toLowerCase().includes(product.name.toLowerCase())) {
                content.headline = `Conheça ${product.name}`
            }
            if (!subheadline || isGenericCopy(subheadline)) {
                content.subheadline = product.shortDescription || product.fullDescription || `Solução ideal para ${product.targetAudience || 'o seu negócio'}.`
            }
            section.content = content as unknown as LandingPageSection['content']
        }

        if (section.type === 'features' && product.features.length > 0) {
            const content = section.content as unknown as Record<string, unknown>
            const items = product.features.slice(0, 6).map((feature, index) => ({
                icon: ['Zap', 'Shield', 'Target', 'Rocket', 'CheckCircle', 'Star'][index % 6],
                title: feature.title,
                description: feature.description,
            }))

            content.title = `Funcionalidades de ${product.name}`
            content.subtitle = product.differentials || product.targetAudience || 'Recursos reais do produto selecionado.'
            content.items = items
            section.content = content as unknown as LandingPageSection['content']
        }

        if (section.type === 'faq' && product.faqs.length > 0) {
            const content = section.content as unknown as Record<string, unknown>
            content.title = `Dúvidas sobre ${product.name}`
            content.subtitle = 'Perguntas e respostas baseadas no produto selecionado.'
            content.items = product.faqs.slice(0, 8).map((faq) => ({
                question: faq.question,
                answer: faq.answer,
            }))
            section.content = content as unknown as LandingPageSection['content']
        }

        if (section.type === 'pricing' && product.price !== null) {
            const content = section.content as unknown as Record<string, unknown>
            const tiers = Array.isArray(content.tiers) ? [...(content.tiers as Array<Record<string, unknown>>)] : []
            const firstTier = tiers[0] ?? {}

            firstTier.name = String(firstTier.name ?? product.name)
            firstTier.price = product.formattedPrice
            firstTier.period = product.priceType === 'monthly' ? '/mês' : product.priceType === 'yearly' ? '/ano' : ''
            firstTier.description = String(firstTier.description ?? product.shortDescription)

            if (product.features.length > 0) {
                firstTier.features = product.features.slice(0, 6).map((f) => f.title)
            }

            tiers[0] = firstTier
            content.title = `Investimento em ${product.name}`
            content.subtitle = String(content.subtitle ?? 'Condição baseada no produto selecionado.')
            content.tiers = tiers
            section.content = content as unknown as LandingPageSection['content']
        }

        if (section.type === 'cta_banner') {
            const content = section.content as unknown as Record<string, unknown>
            const title = String(content.title ?? '').trim()
            if (!title || isGenericCopy(title)) {
                content.title = `Pronto para começar com ${product.name}?`
            }
            section.content = content as unknown as LandingPageSection['content']
        }

        if (section.type === 'contact_form') {
            const content = section.content as unknown as Record<string, unknown>
            const title = String(content.title ?? '').trim()
            if (!title || isGenericCopy(title)) {
                content.title = `Fale com nosso time sobre ${product.name}`
            }
            section.content = content as unknown as LandingPageSection['content']
        }
    }

    if (!cloned.some((section) => section.type === 'features') && product.features.length > 0) {
        cloned.push({
            id: crypto.randomUUID(),
            type: 'features',
            order: cloned.length,
            visible: true,
            content: {
                title: `Funcionalidades de ${product.name}`,
                subtitle: product.differentials || 'Recursos do produto selecionado.',
                columns: 3,
                items: product.features.slice(0, 6).map((feature, index) => ({
                    icon: ['Zap', 'Shield', 'Target', 'Rocket', 'CheckCircle', 'Star'][index % 6],
                    title: feature.title,
                    description: feature.description,
                })),
            },
        } as LandingPageSection)
    }

    if (!cloned.some((section) => section.type === 'faq') && product.faqs.length > 0) {
        cloned.push({
            id: crypto.randomUUID(),
            type: 'faq',
            order: cloned.length,
            visible: true,
            content: {
                title: `Dúvidas sobre ${product.name}`,
                subtitle: 'Perguntas frequentes baseadas no produto selecionado.',
                items: product.faqs.slice(0, 8).map((faq) => ({
                    question: faq.question,
                    answer: faq.answer,
                })),
            },
        } as LandingPageSection)
    }

    return cloned.map((section, index) => ({
        ...section,
        order: index,
    }))
}

function isGenericCopy(text: string): boolean {
    const normalized = text.toLowerCase()
    const genericTokens = [
        'transforme seu negócio',
        'nossos diferenciais',
        'perguntas frequentes',
        'pronto para começar',
        'entre em contato',
        'soluções inovadoras',
    ]
    return genericTokens.some((token) => normalized.includes(token))
}

export async function updateLandingPage(pageId: string, prevState: { error: string; success: boolean }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()

        const input: Record<string, unknown> = {}
        const fields = ['name', 'slug', 'headline', 'subheadline', 'ctaText', 'chatbotName', 'chatbotWelcomeMessage', 'chatbotSystemPrompt']
        for (const field of fields) {
            const value = formData.get(field) as string
            if (value !== null && value !== undefined) input[field] = value
        }

        const configJson: Record<string, unknown> = {}
        if (formData.get('theme')) configJson.theme = formData.get('theme') as string
        if (formData.get('primaryColor')) configJson.primaryColor = formData.get('primaryColor') as string

        const seoTitle = ((formData.get('seoTitle') as string) || '').trim()
        const seoDescription = ((formData.get('seoDescription') as string) || '').trim()
        const seoKeywordsRaw = ((formData.get('seoKeywords') as string) || '').trim()
        const seoOgTitle = ((formData.get('seoOgTitle') as string) || '').trim()
        const seoOgDescription = ((formData.get('seoOgDescription') as string) || '').trim()
        const seoOgImageUrl = ((formData.get('seoOgImageUrl') as string) || '').trim()
        const seoCanonicalUrl = ((formData.get('seoCanonicalUrl') as string) || '').trim()

        const seoKeywords = seoKeywordsRaw
            .split(',')
            .map((keyword) => keyword.trim())
            .filter(Boolean)
            .slice(0, 15)

        const hasSeoInput = Boolean(
            seoTitle
            || seoDescription
            || seoKeywords.length > 0
            || seoOgTitle
            || seoOgDescription
            || seoOgImageUrl
            || seoCanonicalUrl
        )

        if (hasSeoInput) {
            configJson.seo = {
                title: seoTitle || undefined,
                description: seoDescription || undefined,
                keywords: seoKeywords.length > 0 ? seoKeywords : undefined,
                ogTitle: seoOgTitle || undefined,
                ogDescription: seoOgDescription || undefined,
                ogImageUrl: seoOgImageUrl || undefined,
                canonicalUrl: seoCanonicalUrl || undefined,
            }
        }

        // Parse design system from serialized JSON
        const designSystemRaw = formData.get('designSystem') as string | null
        if (designSystemRaw) {
            try {
                const designSystem = JSON.parse(designSystemRaw)
                configJson.designSystem = designSystem
                // Sync primaryColor and theme from design system for backward compat
                configJson.primaryColor = designSystem.palette?.primary ?? configJson.primaryColor
                const bg = designSystem.palette?.background ?? ''
                const isDark = isColorDark(bg)
                configJson.theme = isDark ? 'dark' : 'light'
            } catch {
                // Invalid JSON – ignore design system update
            }
        }

        if (Object.keys(configJson).length > 0) {
            // Merge with existing config to preserve sections and other fields
            const pageResult = await useCases.getLandingPage().execute(orgId, pageId)
            if (pageResult.ok) {
                const currentConfig = pageResult.value.configJson as unknown as Record<string, unknown>
                input.configJson = { ...currentConfig, ...configJson }
            } else {
                input.configJson = configJson
            }
        }

        const result = await useCases.updateLandingPage().execute(orgId, pageId, input)

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/landing-pages')
        revalidatePath(`/landing-pages/${pageId}`)
        revalidatePath(`/p/${result.value.slug}`)
        revalidatePath('/sitemap.xml')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function publishLandingPage(pageId: string, publish: boolean) {
    try {
        const { orgId } = await getAuthContext()
        const pageResult = await useCases.getLandingPage().execute(orgId, pageId)
        if (!pageResult.ok) return { error: pageResult.error.message, success: false }

        const result = await useCases.publishLandingPage().execute(orgId, pageId, publish)

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/landing-pages')
        revalidatePath(`/landing-pages/${pageId}`)
        revalidatePath(`/p/${pageResult.value.slug}`)
        revalidatePath('/sitemap.xml')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function addKnowledgeBaseEntry(prevState: { error: string; success: boolean }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()

        const result = await useCases.addKnowledgeBase().execute(orgId, {
            landingPageId: (formData.get('landingPageId') as string) || null,
            title: formData.get('title') as string,
            content: formData.get('content') as string,
        })

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/landing-pages')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function syncProductKnowledgeBase(pageId: string) {
    try {
        const { orgId } = await getAuthContext()

        const pageResult = await useCases.getLandingPage().execute(orgId, pageId)
        if (!pageResult.ok) return { error: pageResult.error.message, success: false }

        const page = pageResult.value
        if (!page.productId) return { error: 'Nenhum produto vinculado', success: false }

        const productResult = await useCases.getProduct().execute(orgId, page.productId)
        if (!productResult.ok) return { error: 'Produto não encontrado', success: false }

        const product = productResult.value
        const entries: Array<{ title: string; content: string }> = []

        // Main overview
        const overview = [
            `${product.name} — ${product.isProduct() ? 'Produto Digital' : 'Serviço Digital'}`,
            '',
            product.fullDescription || product.shortDescription,
            product.targetAudience ? `\nPúblico-alvo: ${product.targetAudience}` : '',
            product.differentials ? `\nDiferenciais: ${product.differentials}` : '',
            product.price !== null ? `\nPreço: ${product.formattedPrice}` : '',
        ].filter(Boolean).join('\n')
        entries.push({ title: `Sobre: ${product.name}`, content: overview })

        if (product.features.length > 0) {
            entries.push({
                title: `Funcionalidades: ${product.name}`,
                content: product.features.map(f => `• ${f.title}: ${f.description}`).join('\n'),
            })
        }
        if (product.benefits.length > 0) {
            entries.push({
                title: `Benefícios: ${product.name}`,
                content: product.benefits.map(b => `• ${b.title}: ${b.description}`).join('\n'),
            })
        }
        if (product.faqs.length > 0) {
            entries.push({
                title: `Perguntas Frequentes: ${product.name}`,
                content: product.faqs.map(f => `Pergunta: ${f.question}\nResposta: ${f.answer}`).join('\n\n'),
            })
        }

        // Index all entries
        let indexed = 0
        for (const entry of entries) {
            const result = await useCases.addKnowledgeBase().execute(orgId, {
                landingPageId: pageId,
                title: entry.title,
                content: entry.content,
            })
            if (result.ok) indexed++
        }

        revalidatePath(`/landing-pages/${pageId}`)
        return { error: '', success: true, message: `${indexed} entradas indexadas na base de conhecimento` }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function deleteLandingPage(pageId: string) {
    try {
        const { orgId, profile } = await getAuthContext()
        if (!canDo(profile.role, 'deleteLandingPage')) return { error: 'Sem permissão para excluir landing pages.', success: false }
        const pageResult = await useCases.getLandingPage().execute(orgId, pageId)
        if (!pageResult.ok) return { error: pageResult.error.message, success: false }

        const result = await useCases.deleteLandingPage().execute(orgId, pageId)

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/landing-pages')
        revalidatePath(`/p/${pageResult.value.slug}`)
        revalidatePath('/sitemap.xml')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function updateLandingPageSections(pageId: string, sections: LandingPageSection[], designSystem?: DesignSystem) {
    try {
        const { orgId } = await getAuthContext()

        // Get current page to preserve existing config fields
        const pageResult = await useCases.getLandingPage().execute(orgId, pageId)
        if (!pageResult.ok) return { error: pageResult.error.message, success: false }

        const currentConfig = pageResult.value.configJson
        const updatedConfig: Record<string, unknown> = { ...currentConfig, sections }

        if (designSystem) {
            const bg = designSystem.palette?.background ?? ''
            const isDark = isColorDark(bg)
            updatedConfig.designSystem = designSystem
            updatedConfig.primaryColor = designSystem.palette?.primary ?? currentConfig.primaryColor
            updatedConfig.theme = isDark ? 'dark' : 'light'
        }

        const result = await useCases.updateLandingPage().execute(orgId, pageId, {
            configJson: updatedConfig,
        })

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/landing-pages')
        revalidatePath(`/landing-pages/${pageId}`)
        revalidatePath(`/p/${pageResult.value.slug}`)
        revalidatePath('/sitemap.xml')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function isColorDark(hex: string): boolean {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return false
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance < 0.5
}

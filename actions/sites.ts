'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { generateObject } from 'ai'
import { useCases, ragService } from '@/application/services/container'
import { getAuthContext } from '@/infrastructure/auth'
import { structuredOutputModel, DEV_AI_MAX_TOKENS } from '@/lib/ai'
import { buildPremiumSections } from '@/lib/premium-sections-builder'
import { enrichSectionsWithImages, createFallbackIllustrationDataUrl } from '@/lib/landing-page-generation/visuals'
import type { GeneratedSection } from '@/lib/landing-page-generation/types'
import { getErrorMessage } from './utils'

export async function listSites() {
    try {
        const { orgId } = await getAuthContext()
        const sites = await useCases.listSites().execute(orgId)

        let activeDomain = null
        try {
            const domains = await useCases.listCustomDomains().execute(orgId)
            activeDomain = domains.find((domain) => domain.status === 'active')
        } catch (error) {
            console.warn('[sites] Não foi possível carregar domínios personalizados:', getErrorMessage(error))
        }

        return {
            sites: sites.map((site) => ({
                id: site.id,
                name: site.name,
                slug: site.slug,
                createdAt: site.createdAt.toISOString(),
                publicUrl: activeDomain ? `https://${activeDomain.domain}` : null,
                defaultUrl: `/s/${site.slug}`,
                status: site.status || 'draft',
            })),
            error: null,
        }
    } catch (error) {
        return { sites: [], error: getErrorMessage(error) }
    }
}

export async function getSiteDetail(siteId: string) {
    try {
        const { orgId } = await getAuthContext()
        const site = await useCases.getSiteDetail().execute(orgId, siteId)
        return { site, error: null }
    } catch (error) {
        return { site: null, error: getErrorMessage(error) }
    }
}

const CreateSiteSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, { message: 'O nome do site deve ter pelo menos 3 caracteres.' })
        .max(100, { message: 'O nome do site não pode ter mais de 100 caracteres.' }),
    planJson: z.string().optional(),
})

const UpdateSiteSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, { message: 'O nome do site deve ter pelo menos 3 caracteres.' })
        .max(100, { message: 'O nome do site não pode ter mais de 100 caracteres.' })
        .optional(),
    configJson: z.string().optional(),
})

const GenerateSitePlanSchema = z.object({
    brandName: z.string().trim().max(80).optional(),
    businessDescription: z.string().trim().min(10, { message: 'Descreva seu negócio (mínimo 10 caracteres).' }).max(2000),
    targetAudience: z.string().trim().max(120).optional(),
    niche: z.string().trim().max(120).optional(),
    locale: z.string().trim().max(40).optional(),
})

interface SitePlan {
    suggestedName: string
    previewPath: string
    seoTitle: string
    seoDescription: string
    keywords: string[]
    pages: string[]
    modules: string[]
    performanceTips: string
    premiumDesign: string
    testUrlHint: string
}

interface ActionState {
    error: string
    success?: boolean
}

export async function generateSitePlan(formData: FormData): Promise<{ error: string; plan: SitePlan | null }> {
    try {
        const { orgId } = await getAuthContext()

        const validatedFields = GenerateSitePlanSchema.safeParse({
            brandName: formData.get('brandName') || '',
            businessDescription: formData.get('businessDescription') || '',
            targetAudience: formData.get('targetAudience') || '',
            niche: formData.get('niche') || '',
            locale: formData.get('locale') || '',
        })

        if (!validatedFields.success) {
            const flattened = validatedFields.error.flatten()
            const fieldErrorMsg = Object.entries(flattened.fieldErrors)
                .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
                .join('; ')
            return { error: fieldErrorMsg || 'Dados inválidos.', plan: null }
        }

        const { brandName, businessDescription, targetAudience, niche, locale } = validatedFields.data
        const ragFilters = {
            brandName: brandName || undefined,
            niche: niche || undefined,
            targetAudience: targetAudience || undefined,
            locale: locale || undefined,
        }

        const ragMatches = await ragService.search(businessDescription, orgId, undefined, ragFilters)
        const ragContext = ragService.formatContextForLLM(ragMatches.slice(0, 5))

        const systemPrompt = `Você é um assistente especialista em criação de sites e landing pages de alta conversão para negócios brasileiros.
Use o contexto disponível da base de conhecimento RAG para gerar conteúdo rico, profissional e persuasivo.
Gere textos em português brasileiro, com tom profissional mas acessível.
Retorne apenas JSON válido conforme o schema.`

        const prompt = [
            `Marca/Empresa: ${brandName ?? 'Não informado'}`,
            `Descrição do negócio: ${businessDescription}`,
            targetAudience ? `Público-alvo: ${targetAudience}` : '',
            niche ? `Nicho: ${niche}` : '',
            locale ? `Localidade: ${locale}` : '',
            '',
            'Contexto da base de conhecimento:',
            ragContext || 'Sem contexto RAG disponível.',
            '',
            'Gere um plano COMPLETO de criação de site com conteúdo premium para cada seção.',
            '- IMPORTANTE: O "suggestedName" deve ser curto e impactante (máximo 40 caracteres).',
            '- Gere conteúdo real e persuasivo para Hero, Features, FAQ, Stats e CTA.',
            '- Os textos devem ser específicos para o negócio descrito, NÃO genéricos.',
            '- Features: use ícones válidos do Lucide (ex: Zap, Shield, TrendingUp, Target, Layers, BarChart3, Heart, Headphones, Globe, Rocket, Clock, Lock).',
            '- heroImagePrompt: descreva em INGLÊS uma cena visual premium e realista que represente o negócio. Seja específico sobre cenário, pessoas, objetos e iluminação.',
            '- galleryImagePrompts: crie 3 prompts em INGLÊS com cenas diferentes e complementares que representem o negócio visualmente.',
        ].filter(Boolean).join('\n')

        const schema = z.object({
            suggestedName: z.string(),
            previewPath: z.string(),
            seoTitle: z.string(),
            seoDescription: z.string(),
            keywords: z.array(z.string()),
            pages: z.array(z.string()),
            modules: z.array(z.string()),
            performanceTips: z.string(),
            premiumDesign: z.string(),
            testUrlHint: z.string(),
            // Rich section content for premium page generation
            sections: z.object({
                heroKicker: z.string().describe('Frase curta de impacto acima do título (ex: "Inovação para o seu negócio")'),
                heroHeadline: z.string().describe('Título principal do hero, máximo 60 caracteres'),
                heroSubheadline: z.string().describe('Subtítulo do hero, 1-2 frases persuasivas'),
                heroCta: z.string().describe('Texto do botão CTA principal'),
                heroTrustBadges: z.array(z.string()).describe('3 frases curtas de confiança (ex: "Sem compromisso")'),
                heroImagePrompt: z.string().describe('Prompt detalhado em inglês para gerar a imagem do hero via IA. Descreva o cenário visual ideal para o negócio. Ex: "Professional team working in modern office with large screens showing analytics dashboards"'),
                features: z.array(z.object({
                    icon: z.string().describe('Nome do ícone Lucide: Zap, Shield, TrendingUp, Target, Layers, BarChart3, Heart, Globe, Rocket, Clock'),
                    title: z.string(),
                    description: z.string(),
                })).describe('6 funcionalidades/diferenciais do negócio'),
                benefits: z.array(z.object({
                    title: z.string(),
                    description: z.string(),
                })).describe('4 benefícios práticos'),
                processSteps: z.array(z.object({
                    title: z.string(),
                    description: z.string(),
                })).describe('3-4 etapas do processo de trabalho'),
                stats: z.array(z.object({
                    value: z.string().describe('Número com unidade (ex: "500+", "98%", "24/7")'),
                    label: z.string(),
                })).describe('4 estatísticas/números de destaque'),
                faqItems: z.array(z.object({
                    question: z.string(),
                    answer: z.string(),
                })).describe('5 perguntas frequentes com respostas detalhadas'),
                ctaTitle: z.string().describe('Título do banner CTA final'),
                ctaSubtitle: z.string().describe('Subtítulo do banner CTA final'),
                galleryImagePrompts: z.array(z.string()).describe('3 prompts em inglês para gerar imagens de galeria que representem o negócio visualmente. Cada prompt deve descrever uma cena diferente.'),
            }),
        })

        const { object } = await generateObject({
            model: structuredOutputModel,
            schema,
            maxTokens: 3000,
            system: systemPrompt,
            prompt,
            temperature: 0.35,
        })

        return { error: '', plan: object }
    } catch (error: any) {
        console.error('[generateSitePlan] Erro:', error)
        return { error: error.message || 'Erro inesperado na geração.', plan: null }
    }
}

export async function createSite(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        const { orgId } = await getAuthContext()

        const validatedFields = CreateSiteSchema.safeParse({
            name: formData.get('name'),
            planJson: formData.get('planJson'),
        })

        if (!validatedFields.success) {
            const firstError = validatedFields.error.flatten().fieldErrors.name?.[0]
            return { error: firstError ?? 'Dados inválidos.' }
        }

        let configJson: Record<string, any> = {}
        let aiSections: any = undefined
        if (validatedFields.data.planJson) {
            try {
                const plan = JSON.parse(validatedFields.data.planJson)
                aiSections = plan.sections
                configJson = {
                    seo: {
                        title: plan.seoTitle,
                        description: plan.seoDescription,
                        keywords: plan.keywords,
                    },
                    modules: plan.modules,
                    pages: plan.pages,
                    design: {
                        premiumDesign: plan.premiumDesign,
                        performanceTips: plan.performanceTips,
                    }
                }
            } catch (e) {
                console.warn('[sites] Failed to parse planJson', e)
            }
        }

        // Build premium sections from AI-generated content
        const premiumSections = buildPremiumSections({
            siteName: validatedFields.data.name,
            seoTitle: configJson.seo?.title,
            seoDescription: configJson.seo?.description,
            keywords: configJson.seo?.keywords,
            pages: configJson.pages,
            premiumDesign: configJson.design?.premiumDesign,
            aiSections,
        })

        // Enrich sections with AI-generated images (hero, gallery)
        const generatedSections: GeneratedSection[] = premiumSections.map(s => ({
            type: s.type,
            content: s.content as Record<string, unknown>,
        }))

        // Use AI-specific image prompt for better, contextualized images
        const imagePrompt = aiSections?.heroImagePrompt 
            || (validatedFields.data.planJson
                ? (() => { try { const p = JSON.parse(validatedFields.data.planJson!); return `${validatedFields.data.name}. ${p.seoDescription || ''}` } catch { return validatedFields.data.name } })()
                : validatedFields.data.name)

        let enrichedSections: GeneratedSection[]
        try {
            enrichedSections = await enrichSectionsWithImages(generatedSections, {
                prompt: imagePrompt,
                pageContext: {
                    name: validatedFields.data.name,
                    headline: aiSections?.heroHeadline || validatedFields.data.name,
                    subheadline: aiSections?.heroSubheadline || configJson.seo?.description || '',
                },
                imageGeneration: { enabled: true },
            })
        } catch (imgError) {
            console.warn('[sites] Image enrichment failed, using sections without images', imgError)
            // Add fallback hero image even without AI generation
            const heroSection = generatedSections.find(s => s.type === 'hero')
            if (heroSection) {
                const heroContent = heroSection.content as Record<string, unknown>
                if (!heroContent.heroImageUrl && !heroContent.backgroundImageUrl) {
                    heroContent.heroImageUrl = createFallbackIllustrationDataUrl({
                        title: String(heroContent.headline || validatedFields.data.name),
                        subtitle: String(heroContent.subheadline || ''),
                        aspectRatio: '4:3',
                    })
                }
            }
            enrichedSections = generatedSections
        }

        // Rebuild as LandingPageSection[] with IDs and order
        const finalSections = enrichedSections.map((s, i) => ({
            id: `${s.type}-${i}`,
            type: s.type,
            order: i,
            visible: true,
            content: s.content,
        }))

        const siteSlug = validatedFields.data.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 60)

        const site = await useCases.createSite().execute(orgId, {
            name: validatedFields.data.name,
            slug: siteSlug,
            configJson,
            status: 'published',
        })

        // Generate the homepage landing page automatically (ALREADY PUBLISHED)
        const lpResult = await useCases.createLandingPage().execute(orgId, {
            name: 'Início',
            slug: site.id, // We use the site ID as the slug so /p/[site.id] works out of the box
            siteId: site.id,
            isHomepage: true,
            status: 'published',
            headline: aiSections?.heroHeadline || validatedFields.data.name,
            subheadline: aiSections?.heroSubheadline || configJson.seo?.description || '',
            ctaText: aiSections?.heroCta || 'Fale conosco',
            configJson: {
                theme: 'dark',
                primaryColor: '#6366f1',
                seo: configJson.seo,
                sections: finalSections,
            }
        })

        // Revalidate dashboard, public routes and cache tags
        revalidatePath('/sites')
        revalidatePath(`/s/${siteSlug}`)
        revalidatePath(`/p/${site.id}`)
        revalidateTag('landing-pages')
        revalidateTag('sites')
    } catch (error) {
        return { error: getErrorMessage(error) }
    }

    redirect('/sites')
}

export async function updateSite(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        const { orgId } = await getAuthContext()
        const siteId = formData.get('siteId') as string

        if (!siteId) {
            return { error: 'ID do site é obrigatório.', success: false }
        }

        const validatedFields = UpdateSiteSchema.safeParse({
            name: formData.get('name'),
            configJson: formData.get('configJson'),
        })

        if (!validatedFields.success) {
            const firstError = validatedFields.error.flatten().fieldErrors.name?.[0]
            return { error: firstError ?? 'Dados inválidos.', success: false }
        }

        let configJson = undefined
        if (validatedFields.data.configJson) {
            try {
                configJson = JSON.parse(validatedFields.data.configJson)
            } catch (e) {
                console.warn('[updateSite] Failed to parse configJson', e)
            }
        }

        await useCases.updateSite().execute(orgId, siteId, { 
            name: validatedFields.data.name,
            configJson 
        })
        revalidatePath('/sites')
        
        return { success: true, error: '' }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function publishSite(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        const { orgId } = await getAuthContext()
        const siteId = formData.get('siteId') as string

        if (!siteId) {
            return { error: 'ID do site é obrigatório.', success: false }
        }

        // 1. Mark Site as published
        const site = await useCases.getSiteDetail().execute(orgId, siteId)
        await useCases.updateSite().execute(orgId, siteId, { status: 'published' })

        // 2. Also mark the generated homepage as published
        try {
            const { landingPageRepo } = await import('@/application/services/container')
            const page = await landingPageRepo.findBySlug(siteId)
            if (page) {
                await useCases.publishLandingPage().execute(orgId, page.id, true)
            }
        } catch (e) {
            console.warn('[publishSite] Falha ao publicar landing page do site', e)
        }

        revalidatePath('/sites')
        revalidatePath(`/s/${site.slug}`)
        revalidateTag('sites')
        return { success: true, error: '' }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function deleteSite(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        const { orgId } = await getAuthContext()
        const siteId = formData.get('siteId') as string

        if (!siteId) {
            return { success: false, error: 'ID do site é obrigatório.' }
        }

        await useCases.deleteSite().execute(orgId, siteId)
        revalidatePath('/sites')
    } catch (error) {
        return { success: false, error: getErrorMessage(error) }
    }

    redirect('/sites')
}
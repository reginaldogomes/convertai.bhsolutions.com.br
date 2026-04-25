'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { generateObject } from 'ai'
import { useCases, ragService } from '@/application/services/container'
import { getAuthContext } from '@/infrastructure/auth'
import { structuredOutputModel, DEV_AI_MAX_TOKENS } from '@/lib/ai'
import { getErrorMessage } from './utils'

export async function listSites() {
    try {
        const { orgId } = await getAuthContext()
        const sites = await useCases.listSites().execute(orgId)
        return { sites, error: null }
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
        .max(50, { message: 'O nome do site não pode ter mais de 50 caracteres.' }),
})

const UpdateSiteSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, { message: 'O nome do site deve ter pelo menos 3 caracteres.' })
        .max(50, { message: 'O nome do site não pode ter mais de 50 caracteres.' })
        .optional(),
})

const GenerateSitePlanSchema = z.object({
    brandName: z.string().trim().max(80).optional(),
    businessDescription: z.string().trim().min(30, { message: 'Descreva seu negócio com pelo menos 30 caracteres.' }).max(2000),
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

export async function generateSitePlan(prevState: unknown, formData: FormData): Promise<{ error: string; plan: SitePlan | null }> {
    try {
        const { orgId } = await getAuthContext()

        const validatedFields = GenerateSitePlanSchema.safeParse({
            brandName: formData.get('brandName'),
            businessDescription: formData.get('businessDescription'),
            targetAudience: formData.get('targetAudience'),
            niche: formData.get('niche'),
            locale: formData.get('locale'),
        })

        if (!validatedFields.success) {
            const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0]
            return { error: firstError ?? 'Dados inválidos.', plan: null }
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

        const systemPrompt = `Você é um assistente de criação de sites e landing pages com foco em negócios brasileiros.
Use o contexto disponível da base de conhecimento RAG para sugerir nome, estrutura de páginas, SEO, performance, módulos e design premium.
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
            'Gere um plano de criação de site com:' ,
            '- Nome recomendado para o site',
            '- Estrutura de páginas multipage com objetivos claros',
            '- Título SEO e descrição meta',
            '- Lista de keywords de alto valor',
            '- Módulos recomendados (por exemplo, chat, analytics, SEO, integrações)',
            '- Sugestões de design premium e experiência',
            '- Dicas de performance e otimização',
            '- URL de teste ou preview antes de publicar domínio',
        ].filter(Boolean).join('\n')

        const schema = z.object({
            suggestedName: z.string().min(1),
            previewPath: z.string().min(1),
            seoTitle: z.string().min(10),
            seoDescription: z.string().min(20),
            keywords: z.array(z.string()).min(3).max(12),
            pages: z.array(z.string()).min(3).max(10),
            modules: z.array(z.string()).min(2).max(10),
            performanceTips: z.string().min(20),
            premiumDesign: z.string().min(20),
            testUrlHint: z.string().min(10),
        })

        const { object } = await generateObject({
            model: structuredOutputModel,
            schema,
            maxTokens: DEV_AI_MAX_TOKENS,
            system: systemPrompt,
            prompt,
            temperature: 0.35,
            maxOutputTokens: 1000,
        })

        return { error: '', plan: object }
    } catch (error) {
        return { error: getErrorMessage(error), plan: null }
    }
}

export async function createSite(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        const { orgId } = await getAuthContext()

        const validatedFields = CreateSiteSchema.safeParse({
            name: formData.get('name'),
        })

        if (!validatedFields.success) {
            const firstError = validatedFields.error.flatten().fieldErrors.name?.[0]
            return { error: firstError ?? 'Dados inválidos.' }
        }

        await useCases.createSite().execute(orgId, { name: validatedFields.data.name })
        revalidatePath('/sites')
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
        })

        if (!validatedFields.success) {
            const firstError = validatedFields.error.flatten().fieldErrors.name?.[0]
            return { error: firstError ?? 'Dados inválidos.', success: false }
        }

        await useCases.updateSite().execute(orgId, siteId, { name: validatedFields.data.name })
        revalidatePath('/sites')
        
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
        
        return { success: true, error: '' }
    } catch (error) {
        return { success: false, error: getErrorMessage(error) }
    }
}
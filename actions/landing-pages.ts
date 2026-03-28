'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from './utils'
import type { LandingPageSection } from '@/domain/entities'

export async function createLandingPage(prevState: { error: string; success: boolean }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()

        const limitCheck = await useCases.checkLimit().execute(orgId, 'landing_pages')
        if (!limitCheck.allowed) {
            return {
                error: `Limite de ${limitCheck.label} atingido (${limitCheck.current}/${limitCheck.limit}). Faça upgrade do seu plano para criar mais landing pages.`,
                success: false,
            }
        }

        const result = await useCases.createLandingPage().execute(orgId, {
            name: formData.get('name') as string,
            slug: formData.get('slug') as string,
            headline: (formData.get('headline') as string) || '',
            subheadline: (formData.get('subheadline') as string) || '',
            ctaText: (formData.get('ctaText') as string) || 'Fale conosco',
            chatbotName: (formData.get('chatbotName') as string) || 'Assistente',
            chatbotWelcomeMessage: (formData.get('chatbotWelcomeMessage') as string) || 'Olá! Como posso ajudar?',
            chatbotSystemPrompt: (formData.get('chatbotSystemPrompt') as string) || '',
        })

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/landing-pages')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
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
        if (Object.keys(configJson).length > 0) input.configJson = configJson

        const result = await useCases.updateLandingPage().execute(orgId, pageId, input)

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/landing-pages')
        revalidatePath(`/landing-pages/${pageId}`)
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function publishLandingPage(pageId: string, publish: boolean) {
    try {
        const { orgId } = await getAuthContext()
        const result = await useCases.publishLandingPage().execute(orgId, pageId, publish)

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/landing-pages')
        revalidatePath(`/landing-pages/${pageId}`)
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function addKnowledgeBaseEntry(prevState: { error: string; success: boolean }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()

        const limitCheck = await useCases.checkLimit().execute(orgId, 'knowledge_base')
        if (!limitCheck.allowed) {
            return {
                error: `Limite de ${limitCheck.label} atingido (${limitCheck.current}/${limitCheck.limit}). Faça upgrade do seu plano para adicionar mais documentos à base de conhecimento.`,
                success: false,
            }
        }

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

export async function updateLandingPageSections(pageId: string, sections: LandingPageSection[]) {
    try {
        const { orgId } = await getAuthContext()

        // Get current page to preserve existing config fields
        const pageResult = await useCases.getLandingPage().execute(orgId, pageId)
        if (!pageResult.ok) return { error: pageResult.error.message, success: false }

        const currentConfig = pageResult.value.configJson
        const updatedConfig = { ...currentConfig, sections }

        const result = await useCases.updateLandingPage().execute(orgId, pageId, {
            configJson: updatedConfig as Record<string, unknown>,
        })

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/landing-pages')
        revalidatePath(`/landing-pages/${pageId}`)
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

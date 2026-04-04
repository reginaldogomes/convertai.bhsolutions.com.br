'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from './utils'
import type { LandingPageSection } from '@/domain/entities'
import type { DesignSystem } from '@/domain/value-objects/design-system'
import { DEFAULT_DESIGN_SYSTEM } from '@/domain/value-objects/design-system'

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

        const result = await useCases.createLandingPage().execute(orgId, {
            name: formData.get('name') as string,
            slug: formData.get('slug') as string,
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
            },
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

export async function deleteLandingPage(pageId: string) {
    try {
        const { orgId } = await getAuthContext()
        const result = await useCases.deleteLandingPage().execute(orgId, pageId)

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/landing-pages')
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

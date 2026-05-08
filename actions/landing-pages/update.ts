'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from '../utils'
import type { LandingPageSection } from '@/domain/entities'
import type { DesignSystem } from '@/domain/value-objects/design-system'
import { isColorDark } from './utils'

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

        const designSystemRaw = formData.get('designSystem') as string | null
        if (designSystemRaw) {
            try {
                const designSystem = JSON.parse(designSystemRaw)
                configJson.designSystem = designSystem
                configJson.primaryColor = designSystem.palette?.primary ?? configJson.primaryColor
                const bg = designSystem.palette?.background ?? ''
                const isDark = isColorDark(bg)
                configJson.theme = isDark ? 'dark' : 'light'
            } catch {
                // Invalid JSON – ignore design system update
            }
        }

        if (Object.keys(configJson).length > 0) {
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
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function updateLandingPageSections(pageId: string, sections: LandingPageSection[], designSystem?: DesignSystem) {
    try {
        const { orgId } = await getAuthContext()

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
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

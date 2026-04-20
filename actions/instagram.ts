'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases, instagramAccountRepo } from '@/application/services/container'
import { getErrorMessage } from './utils'

export async function createInstagramContent(prevState: { error: string; success: boolean }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()

        const mediaUrlsRaw = (formData.get('media_urls') as string) || '[]'
        const hashtagsRaw = formData.get('hashtags') as string || ''
        let mediaUrls: string[] = []

        try {
            mediaUrls = JSON.parse(mediaUrlsRaw)
        } catch {
            return { error: 'Formato inválido para as URLs de mídia.', success: false }
        }

        const result = await useCases.createInstagramContent().execute(orgId, {
            type: (formData.get('type') as string) || 'post',
            caption: formData.get('caption') as string || '',
            mediaUrls: mediaUrls,
            hashtags: hashtagsRaw.split(',').map(h => h.trim().replace(/^#/, '')).filter(Boolean),
        })

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/instagram')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function updateInstagramContent(prevState: { error: string; success: boolean }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()
        const contentId = formData.get('content_id') as string

        const mediaUrlsRaw = formData.get('media_urls') as string | null
        const hashtagsRaw = formData.get('hashtags') as string | null
        let mediaUrls: string[] | undefined

        try {
            if (mediaUrlsRaw) mediaUrls = JSON.parse(mediaUrlsRaw)
        } catch {
            return { error: 'Formato inválido para as URLs de mídia.', success: false }
        }

        const result = await useCases.updateInstagramContent().execute(orgId, contentId, {
            type: formData.get('type') as string | undefined,
            caption: formData.get('caption') as string | undefined,
            mediaUrls,
            hashtags: hashtagsRaw ? hashtagsRaw.split(',').map(h => h.trim().replace(/^#/, '')).filter(Boolean) : undefined,
        })

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/instagram')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function publishInstagramContent(contentId: string) {
    try {
        const { orgId } = await getAuthContext()
        const result = await useCases.publishInstagramContent().execute(orgId, contentId)

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/instagram')
        return { error: '', success: true, igPostId: result.value.igPostId }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function deleteInstagramContent(contentId: string) {
    try {
        const { orgId } = await getAuthContext()
        const result = await useCases.deleteInstagramContent().execute(orgId, contentId)

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/instagram')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function disconnectInstagram() {
    try {
        const { orgId } = await getAuthContext()
        const disconnected = await instagramAccountRepo.delete(orgId)
        if (!disconnected) {
            return { error: 'Não foi possível desconectar a conta do Instagram.', success: false }
        }

        revalidatePath('/instagram')
        return { success: true, error: '' }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function saveAutoContentConfig(prevState: { error: string; success: boolean }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()

        const contentTypes = (formData.get('content_types') as string || '').split(',').filter(Boolean)
        const objectives = (formData.get('objectives') as string || '').split(',').filter(Boolean)
        const defaultHashtags = (formData.get('default_hashtags') as string || '')
            .split(',').map(h => h.trim().replace(/^#/, '')).filter(Boolean)
        const referenceProfiles = (formData.get('reference_profiles') as string || '')
            .split(',').map(p => p.trim().replace(/^@/, '')).filter(Boolean)

        const result = await useCases.saveAutoConfig().execute(orgId, {
            niche: formData.get('niche') as string || '',
            brand_description: formData.get('brand_description') as string || '',
            target_audience: formData.get('target_audience') as string || '',
            tone: formData.get('tone') as string || 'profissional',
            language: formData.get('language') as string || 'pt-BR',
            content_types: contentTypes,
            objectives,
            posts_per_week: Number(formData.get('posts_per_week')) || 3,
            hashtag_strategy: formData.get('hashtag_strategy') as string || 'mix',
            default_hashtags: defaultHashtags,
            visual_style: formData.get('visual_style') as string || 'moderno',
            cta_style: formData.get('cta_style') as string || 'sutil',
            avoid_topics: formData.get('avoid_topics') as string || '',
            reference_profiles: referenceProfiles,
        })

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/instagram')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function toggleAutoContentConfig(active: boolean) {
    try {
        const { orgId } = await getAuthContext()
        const result = await useCases.toggleAutoConfig().execute(orgId, active)

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/instagram')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from './utils'

// ─── Content CRUD ──────────────────────────────────────────────────────────────

export async function createInstagramContent(prevState: { error: string; success: boolean }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()

        let mediaUrls: string[] = []
        try {
            mediaUrls = JSON.parse((formData.get('media_urls') as string) || '[]')
        } catch {
            return { error: 'Formato inválido para URLs de mídia.', success: false }
        }

        const hashtagsRaw = formData.get('hashtags') as string || ''
        const scheduledAtRaw = formData.get('scheduled_at') as string | null

        const result = await useCases.createInstagramContent().execute(orgId, {
            type: (formData.get('type') as string) || 'post',
            caption: (formData.get('caption') as string) || '',
            mediaUrls,
            hashtags: hashtagsRaw.split(',').map(h => h.trim().replace(/^#/, '')).filter(Boolean),
            scheduledAt: scheduledAtRaw || null,
        })

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/instagram')
        return { error: '', success: true, id: result.value.id }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function updateInstagramContent(prevState: { error: string; success: boolean }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()
        const contentId = formData.get('content_id') as string

        let mediaUrls: string[] | undefined
        try {
            const raw = formData.get('media_urls') as string | null
            if (raw) mediaUrls = JSON.parse(raw)
        } catch {
            return { error: 'Formato inválido para URLs de mídia.', success: false }
        }

        const hashtagsRaw = formData.get('hashtags') as string | null
        const scheduledAtRaw = formData.get('scheduled_at') as string | null

        const result = await useCases.updateInstagramContent().execute(orgId, contentId, {
            type: formData.get('type') as string | undefined,
            caption: formData.get('caption') as string | undefined,
            mediaUrls,
            hashtags: hashtagsRaw ? hashtagsRaw.split(',').map(h => h.trim().replace(/^#/, '')).filter(Boolean) : undefined,
            scheduledAt: scheduledAtRaw !== undefined ? scheduledAtRaw : undefined,
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

export async function scheduleInstagramContent(contentId: string, scheduledAt: string) {
    try {
        const { orgId } = await getAuthContext()
        const result = await useCases.scheduleInstagramContent().execute(orgId, contentId, scheduledAt)

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/instagram')
        return { error: '', success: true }
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

export async function syncInstagramMetrics(contentId: string) {
    try {
        const { orgId } = await getAuthContext()
        const result = await useCases.syncContentMetrics().execute(orgId, contentId)

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/instagram')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

// ─── Account ───────────────────────────────────────────────────────────────────

export async function disconnectInstagram() {
    try {
        const { orgId } = await getAuthContext()
        const result = await useCases.disconnectInstagram().execute(orgId)

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/instagram')
        return { success: true, error: '' }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function refreshInstagramToken() {
    try {
        const { orgId } = await getAuthContext()
        // Refresh just this org's token (threshold = 999 days = force refresh)
        const { instagramAccountRepo, instagramService } = await import('@/application/services/container')
        const account = await instagramAccountRepo.findByOrgId(orgId)
        if (!account) return { error: 'Conta não conectada', success: false }

        const newToken = await instagramService.refreshLongLivedToken(account.access_token)
        if (!newToken) return { error: 'Falha ao renovar token. Reconecte sua conta.', success: false }

        const expiresAt = new Date(Date.now() + newToken.expires_in * 1000).toISOString()
        await instagramAccountRepo.updateToken(orgId, newToken.access_token, expiresAt)

        revalidatePath('/instagram')
        return { success: true, error: '', expiresAt }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

// ─── Auto-config ───────────────────────────────────────────────────────────────

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
            niche: (formData.get('niche') as string) || '',
            brand_description: (formData.get('brand_description') as string) || '',
            target_audience: (formData.get('target_audience') as string) || '',
            tone: (formData.get('tone') as string) || 'profissional',
            language: (formData.get('language') as string) || 'pt-BR',
            content_types: contentTypes,
            objectives,
            posts_per_week: Number(formData.get('posts_per_week')) || 3,
            hashtag_strategy: (formData.get('hashtag_strategy') as string) || 'mix',
            default_hashtags: defaultHashtags,
            visual_style: (formData.get('visual_style') as string) || 'moderno',
            cta_style: (formData.get('cta_style') as string) || 'sutil',
            avoid_topics: (formData.get('avoid_topics') as string) || '',
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

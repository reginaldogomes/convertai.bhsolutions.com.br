import type { IInstagramService } from '@/domain/interfaces/instagram-repository'
import type { InstagramMetricsJson } from '@/types/instagram'

const GRAPH_API = 'https://graph.facebook.com/v21.0'

// ─── Error Classification ────────────────────────────────────────────────────

export type MetaErrorCode =
    | 'token_expired'
    | 'permission_denied'
    | 'rate_limited'
    | 'invalid_media'
    | 'account_not_found'
    | 'unknown'

export class MetaApiError extends Error {
    constructor(
        message: string,
        public readonly code: MetaErrorCode,
        public readonly raw?: unknown,
    ) {
        super(message)
        this.name = 'MetaApiError'
    }
}

function classifyError(body: { error?: { code?: number; type?: string; message?: string } }): MetaApiError {
    const err = body.error
    if (!err) return new MetaApiError('Resposta inesperada da API do Meta', 'unknown', body)
    const c = err.code ?? 0
    if (c === 190 || c === 102) return new MetaApiError('Token do Instagram expirado ou inválido', 'token_expired', err)
    if (c === 100 || c === 200) return new MetaApiError('Permissão insuficiente: ' + (err.message ?? ''), 'permission_denied', err)
    if (c === 613 || c === 4) return new MetaApiError('Limite de requisições atingido', 'rate_limited', err)
    if (c === 36000 || (err.message ?? '').toLowerCase().includes('media')) return new MetaApiError('Mídia inválida ou inacessível', 'invalid_media', err)
    return new MetaApiError(err.message ?? 'Erro desconhecido da API Meta', 'unknown', err)
}

async function metaPost(url: string, body: Record<string, unknown>): Promise<Response> {
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

// ─── Service Implementation ───────────────────────────────────────────────────

export class MetaInstagramService implements IInstagramService {

    // ── Publish ───────────────────────────────────────────────────────────────

    async publishPost(accessToken: string, igUserId: string, imageUrl: string, caption: string): Promise<{ id: string }> {
        const containerRes = await metaPost(`${GRAPH_API}/${igUserId}/media`, {
            image_url: imageUrl,
            caption,
            access_token: accessToken,
        })
        const container = await containerRes.json() as { id?: string; error?: { code?: number; message?: string } }
        if (!container.id) throw classifyError(container)

        const publishRes = await metaPost(`${GRAPH_API}/${igUserId}/media_publish`, {
            creation_id: container.id,
            access_token: accessToken,
        })
        const published = await publishRes.json() as { id?: string; error?: { code?: number; message?: string } }
        if (!published.id) throw classifyError(published)
        return { id: published.id }
    }

    async publishCarousel(accessToken: string, igUserId: string, mediaUrls: string[], caption: string): Promise<{ id: string }> {
        const childIds: string[] = []
        for (const url of mediaUrls) {
            const res = await metaPost(`${GRAPH_API}/${igUserId}/media`, {
                image_url: url,
                is_carousel_item: true,
                access_token: accessToken,
            })
            const child = await res.json() as { id?: string; error?: { code?: number; message?: string } }
            if (!child.id) throw classifyError(child)
            childIds.push(child.id)
        }

        const containerRes = await metaPost(`${GRAPH_API}/${igUserId}/media`, {
            media_type: 'CAROUSEL',
            children: childIds,
            caption,
            access_token: accessToken,
        })
        const container = await containerRes.json() as { id?: string; error?: { code?: number; message?: string } }
        if (!container.id) throw classifyError(container)

        const publishRes = await metaPost(`${GRAPH_API}/${igUserId}/media_publish`, {
            creation_id: container.id,
            access_token: accessToken,
        })
        const published = await publishRes.json() as { id?: string; error?: { code?: number; message?: string } }
        if (!published.id) throw classifyError(published)
        return { id: published.id }
    }

    async publishReel(accessToken: string, igUserId: string, videoUrl: string, caption: string): Promise<{ id: string }> {
        const containerRes = await metaPost(`${GRAPH_API}/${igUserId}/media`, {
            media_type: 'REELS',
            video_url: videoUrl,
            caption,
            access_token: accessToken,
        })
        const container = await containerRes.json() as { id?: string; error?: { code?: number; message?: string } }
        if (!container.id) throw classifyError(container)

        const publishRes = await metaPost(`${GRAPH_API}/${igUserId}/media_publish`, {
            creation_id: container.id,
            access_token: accessToken,
        })
        const published = await publishRes.json() as { id?: string; error?: { code?: number; message?: string } }
        if (!published.id) throw classifyError(published)
        return { id: published.id }
    }

    async publishStory(accessToken: string, igUserId: string, mediaUrl: string): Promise<{ id: string }> {
        const isVideo = /\.(mp4|mov|webm)$/i.test(mediaUrl)
        const containerRes = await metaPost(`${GRAPH_API}/${igUserId}/media`, {
            media_type: 'STORIES',
            ...(isVideo ? { video_url: mediaUrl } : { image_url: mediaUrl }),
            access_token: accessToken,
        })
        const container = await containerRes.json() as { id?: string; error?: { code?: number; message?: string } }
        if (!container.id) throw classifyError(container)

        const publishRes = await metaPost(`${GRAPH_API}/${igUserId}/media_publish`, {
            creation_id: container.id,
            access_token: accessToken,
        })
        const published = await publishRes.json() as { id?: string; error?: { code?: number; message?: string } }
        if (!published.id) throw classifyError(published)
        return { id: published.id }
    }

    // ── Insights ──────────────────────────────────────────────────────────────

    async getMediaInsights(accessToken: string, mediaId: string): Promise<InstagramMetricsJson | null> {
        try {
            const res = await fetch(
                `${GRAPH_API}/${mediaId}/insights?metric=likes,comments,shares,saved,reach,impressions&access_token=${encodeURIComponent(accessToken)}`
            )
            const data = await res.json() as { data?: Array<{ name: string; values?: Array<{ value: number }> }> }
            if (!data.data) return null

            const m: Record<string, number> = {}
            for (const item of data.data) {
                m[item.name] = item.values?.[0]?.value ?? 0
            }

            const totalEng = (m.likes ?? 0) + (m.comments ?? 0) + (m.shares ?? 0) + (m.saved ?? 0)
            return {
                likes: m.likes ?? 0,
                comments: m.comments ?? 0,
                shares: m.shares ?? 0,
                saves: m.saved ?? 0,
                reach: m.reach ?? 0,
                impressions: m.impressions ?? 0,
                engagement_rate: m.reach ? Math.round((totalEng / m.reach) * 10000) / 100 : 0,
            }
        } catch {
            return null
        }
    }

    async getAccountInfo(accessToken: string, igUserId: string): Promise<{ followers_count: number; media_count: number } | null> {
        try {
            const res = await fetch(
                `${GRAPH_API}/${igUserId}?fields=followers_count,media_count&access_token=${encodeURIComponent(accessToken)}`
            )
            const data = await res.json() as { followers_count?: number; media_count?: number }
            return {
                followers_count: data.followers_count ?? 0,
                media_count: data.media_count ?? 0,
            }
        } catch {
            return null
        }
    }

    // ── OAuth ─────────────────────────────────────────────────────────────────

    async exchangeCodeForToken(code: string, redirectUri: string): Promise<{ access_token: string; user_id: string } | null> {
        try {
            const params = new URLSearchParams({
                client_id: process.env.META_APP_ID ?? '',
                client_secret: process.env.META_APP_SECRET ?? '',
                redirect_uri: redirectUri,
                code,
            })
            const res = await fetch(`${GRAPH_API}/oauth/access_token?${params}`)
            const data = await res.json() as { access_token?: string }
            if (!data.access_token) return null

            const meRes = await fetch(`${GRAPH_API}/me?access_token=${encodeURIComponent(data.access_token)}`)
            const me = await meRes.json() as { id?: string }
            return { access_token: data.access_token, user_id: me.id ?? '' }
        } catch {
            return null
        }
    }

    async getLongLivedToken(shortToken: string): Promise<{ access_token: string; expires_in: number } | null> {
        try {
            const params = new URLSearchParams({
                grant_type: 'fb_exchange_token',
                client_id: process.env.META_APP_ID ?? '',
                client_secret: process.env.META_APP_SECRET ?? '',
                fb_exchange_token: shortToken,
            })
            const res = await fetch(`${GRAPH_API}/oauth/access_token?${params}`)
            const data = await res.json() as { access_token?: string; expires_in?: number }
            return data.access_token
                ? { access_token: data.access_token, expires_in: data.expires_in ?? 5_184_000 }
                : null
        } catch {
            return null
        }
    }

    /**
     * Refresh an existing long-lived token before it expires.
     * The Meta API issues a new token with a new 60-day window.
     */
    async refreshLongLivedToken(currentToken: string): Promise<{ access_token: string; expires_in: number } | null> {
        try {
            const params = new URLSearchParams({
                grant_type: 'fb_exchange_token',
                client_id: process.env.META_APP_ID ?? '',
                client_secret: process.env.META_APP_SECRET ?? '',
                fb_exchange_token: currentToken,
            })
            const res = await fetch(`${GRAPH_API}/oauth/access_token?${params}`)
            const data = await res.json() as { access_token?: string; expires_in?: number }
            return data.access_token
                ? { access_token: data.access_token, expires_in: data.expires_in ?? 5_184_000 }
                : null
        } catch {
            return null
        }
    }

    /**
     * Revoke a token when the user disconnects.
     * Prevents the token from being used even if leaked.
     */
    async revokeToken(token: string): Promise<void> {
        try {
            await fetch(`${GRAPH_API}/me/permissions?access_token=${encodeURIComponent(token)}`, {
                method: 'DELETE',
            })
        } catch {
            // Non-critical — token will expire naturally
        }
    }

    async getInstagramBusinessAccount(userAccessToken: string): Promise<{
        ig_user_id: string
        ig_username: string
        page_id: string
        page_access_token: string
        followers_count: number
        media_count: number
    } | null> {
        try {
            const pagesRes = await fetch(
                `${GRAPH_API}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(userAccessToken)}`
            )
            const pagesData = await pagesRes.json() as { data?: Array<{ id: string; access_token: string; instagram_business_account?: { id: string } }> }

            if (!pagesData.data?.length) return null

            const pageWithIg = pagesData.data.find(p => p.instagram_business_account?.id)
            if (!pageWithIg) return null

            const igUserId = pageWithIg.instagram_business_account!.id
            const pageAccessToken = pageWithIg.access_token

            const igRes = await fetch(
                `${GRAPH_API}/${igUserId}?fields=username,followers_count,media_count&access_token=${encodeURIComponent(pageAccessToken)}`
            )
            const igData = await igRes.json() as { username?: string; followers_count?: number; media_count?: number }

            return {
                ig_user_id: igUserId,
                ig_username: igData.username ?? igUserId,
                page_id: pageWithIg.id,
                page_access_token: pageAccessToken,
                followers_count: igData.followers_count ?? 0,
                media_count: igData.media_count ?? 0,
            }
        } catch {
            return null
        }
    }
}

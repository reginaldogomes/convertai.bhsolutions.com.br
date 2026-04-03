import type { IInstagramService } from '@/domain/interfaces/instagram-repository'
import type { InstagramMetricsJson } from '@/types/instagram'

const GRAPH_API = 'https://graph.facebook.com/v21.0'

export class MetaInstagramService implements IInstagramService {
    async publishPost(accessToken: string, igUserId: string, imageUrl: string, caption: string): Promise<{ id: string } | null> {
        try {
            // Step 1: Create media container
            const containerRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_url: imageUrl,
                    caption,
                    access_token: accessToken,
                }),
            })
            const container = await containerRes.json()
            if (!container.id) return null

            // Step 2: Publish container
            const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creation_id: container.id,
                    access_token: accessToken,
                }),
            })
            const published = await publishRes.json()
            return published.id ? { id: published.id } : null
        } catch (error) {
            console.error('[MetaInstagramService] publishPost error:', error)
            return null
        }
    }

    async publishCarousel(accessToken: string, igUserId: string, mediaUrls: string[], caption: string): Promise<{ id: string } | null> {
        try {
            // Step 1: Create child containers
            const childIds: string[] = []
            for (const url of mediaUrls) {
                const res = await fetch(`${GRAPH_API}/${igUserId}/media`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image_url: url,
                        is_carousel_item: true,
                        access_token: accessToken,
                    }),
                })
                const child = await res.json()
                if (child.id) childIds.push(child.id)
            }
            if (childIds.length === 0) return null

            // Step 2: Create carousel container
            const containerRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    media_type: 'CAROUSEL',
                    children: childIds,
                    caption,
                    access_token: accessToken,
                }),
            })
            const container = await containerRes.json()
            if (!container.id) return null

            // Step 3: Publish
            const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creation_id: container.id,
                    access_token: accessToken,
                }),
            })
            const published = await publishRes.json()
            return published.id ? { id: published.id } : null
        } catch (error) {
            console.error('[MetaInstagramService] publishCarousel error:', error)
            return null
        }
    }

    async publishReel(accessToken: string, igUserId: string, videoUrl: string, caption: string): Promise<{ id: string } | null> {
        try {
            const containerRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    media_type: 'REELS',
                    video_url: videoUrl,
                    caption,
                    access_token: accessToken,
                }),
            })
            const container = await containerRes.json()
            if (!container.id) return null

            // Wait for processing then publish
            const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creation_id: container.id,
                    access_token: accessToken,
                }),
            })
            const published = await publishRes.json()
            return published.id ? { id: published.id } : null
        } catch (error) {
            console.error('[MetaInstagramService] publishReel error:', error)
            return null
        }
    }

    async publishStory(accessToken: string, igUserId: string, mediaUrl: string): Promise<{ id: string } | null> {
        try {
            const isVideo = /\.(mp4|mov|webm)$/i.test(mediaUrl)
            const containerRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    media_type: 'STORIES',
                    ...(isVideo ? { video_url: mediaUrl } : { image_url: mediaUrl }),
                    access_token: accessToken,
                }),
            })
            const container = await containerRes.json()
            if (!container.id) return null

            const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creation_id: container.id,
                    access_token: accessToken,
                }),
            })
            const published = await publishRes.json()
            return published.id ? { id: published.id } : null
        } catch (error) {
            console.error('[MetaInstagramService] publishStory error:', error)
            return null
        }
    }

    async getMediaInsights(accessToken: string, mediaId: string): Promise<InstagramMetricsJson | null> {
        try {
            const res = await fetch(
                `${GRAPH_API}/${mediaId}/insights?metric=likes,comments,shares,saved,reach,impressions&access_token=${encodeURIComponent(accessToken)}`
            )
            const data = await res.json()
            if (!data.data) return null

            const metrics: Record<string, number> = {}
            for (const item of data.data) {
                metrics[item.name] = item.values?.[0]?.value ?? 0
            }

            const totalEngagement = (metrics.likes ?? 0) + (metrics.comments ?? 0) + (metrics.shares ?? 0) + (metrics.saved ?? 0)
            const engagementRate = metrics.reach ? (totalEngagement / metrics.reach) * 100 : 0

            return {
                likes: metrics.likes ?? 0,
                comments: metrics.comments ?? 0,
                shares: metrics.shares ?? 0,
                saves: metrics.saved ?? 0,
                reach: metrics.reach ?? 0,
                impressions: metrics.impressions ?? 0,
                engagement_rate: Math.round(engagementRate * 100) / 100,
            }
        } catch (error) {
            console.error('[MetaInstagramService] getMediaInsights error:', error)
            return null
        }
    }

    async getAccountInfo(accessToken: string, igUserId: string): Promise<{ followers_count: number; media_count: number } | null> {
        try {
            const res = await fetch(
                `${GRAPH_API}/${igUserId}?fields=followers_count,media_count&access_token=${encodeURIComponent(accessToken)}`
            )
            const data = await res.json()
            return {
                followers_count: data.followers_count ?? 0,
                media_count: data.media_count ?? 0,
            }
        } catch (error) {
            console.error('[MetaInstagramService] getAccountInfo error:', error)
            return null
        }
    }

    async exchangeCodeForToken(code: string, redirectUri: string): Promise<{ access_token: string; user_id: string } | null> {
        try {
            // Facebook Login flow — exchange code via Graph API
            const params = new URLSearchParams({
                client_id: process.env.META_APP_ID ?? '',
                client_secret: process.env.META_APP_SECRET ?? '',
                redirect_uri: redirectUri,
                code,
            })
            const res = await fetch(`${GRAPH_API}/oauth/access_token?${params.toString()}`)
            const data = await res.json()
            if (!data.access_token) {
                console.error('[MetaInstagramService] exchangeCodeForToken failed:', data)
                return null
            }
            // Get user ID from the token
            const meRes = await fetch(`${GRAPH_API}/me?access_token=${encodeURIComponent(data.access_token)}`)
            const me = await meRes.json()
            return { access_token: data.access_token, user_id: me.id ?? '' }
        } catch (error) {
            console.error('[MetaInstagramService] exchangeCodeForToken error:', error)
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
            const res = await fetch(`${GRAPH_API}/oauth/access_token?${params.toString()}`)
            const data = await res.json()
            return data.access_token ? { access_token: data.access_token, expires_in: data.expires_in ?? 5184000 } : null
        } catch (error) {
            console.error('[MetaInstagramService] getLongLivedToken error:', error)
            return null
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
            // 1. Get user's pages with IG business account info
            const pagesRes = await fetch(
                `${GRAPH_API}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(userAccessToken)}`
            )
            const pagesData = await pagesRes.json()

            if (!pagesData.data?.length) {
                console.error('[MetaInstagramService] No pages found')
                return null
            }

            // 2. Find first page with an Instagram business account
            const pageWithIg = pagesData.data.find(
                (p: { instagram_business_account?: { id: string } }) => p.instagram_business_account?.id
            )

            if (!pageWithIg) {
                console.error('[MetaInstagramService] No page with Instagram business account found')
                return null
            }

            const igUserId = pageWithIg.instagram_business_account.id
            const pageAccessToken = pageWithIg.access_token

            // 3. Get Instagram account details
            const igRes = await fetch(
                `${GRAPH_API}/${igUserId}?fields=username,followers_count,media_count&access_token=${encodeURIComponent(pageAccessToken)}`
            )
            const igData = await igRes.json()

            return {
                ig_user_id: igUserId,
                ig_username: igData.username ?? igUserId,
                page_id: pageWithIg.id,
                page_access_token: pageAccessToken,
                followers_count: igData.followers_count ?? 0,
                media_count: igData.media_count ?? 0,
            }
        } catch (error) {
            console.error('[MetaInstagramService] getInstagramBusinessAccount error:', error)
            return null
        }
    }
}

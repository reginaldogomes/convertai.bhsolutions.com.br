import type { InstagramContent } from '@/domain/entities/instagram-content'
import type { InstagramContentRow, InstagramContentStatus, InstagramAccountRow, InstagramMetricsJson, InstagramAutoConfigRow } from '@/types/instagram'

export interface CreateInstagramContentInput {
    organizationId: string
    type: string
    caption: string
    mediaUrls: string[]
    thumbnailUrl?: string | null
    hashtags?: string[]
    scheduledAt?: string | null
}

export interface UpdateInstagramContentInput {
    caption?: string
    mediaUrls?: string[]
    thumbnailUrl?: string | null
    hashtags?: string[]
    type?: string
    scheduledAt?: string | null
}

export interface IInstagramContentRepository {
    findById(id: string): Promise<InstagramContent | null>
    findByOrgId(orgId: string): Promise<InstagramContentRow[]>
    findScheduledDue(): Promise<InstagramContentRow[]>
    findPublishedForMetrics(sinceHours?: number): Promise<InstagramContentRow[]>
    create(input: CreateInstagramContentInput): Promise<InstagramContent | null>
    update(id: string, orgId: string, input: UpdateInstagramContentInput): Promise<InstagramContent | null>
    updateStatus(id: string, orgId: string, status: InstagramContentStatus, extra?: Record<string, unknown>): Promise<boolean>
    updateMetrics(id: string, metrics: InstagramMetricsJson): Promise<boolean>
    delete(id: string, orgId: string): Promise<boolean>
    countByOrgId(orgId: string): Promise<number>
}

export interface IInstagramAccountRepository {
    findByOrgId(orgId: string): Promise<InstagramAccountRow | null>
    findAllExpiringSoon(daysThreshold: number): Promise<InstagramAccountRow[]>
    upsert(orgId: string, data: Omit<InstagramAccountRow, 'id' | 'organization_id' | 'connected_at'>): Promise<boolean>
    updateToken(orgId: string, token: string, expiresAt: string): Promise<boolean>
    delete(orgId: string): Promise<boolean>
}

export interface IInstagramService {
    publishPost(accessToken: string, igUserId: string, imageUrl: string, caption: string): Promise<{ id: string }>
    publishCarousel(accessToken: string, igUserId: string, mediaUrls: string[], caption: string): Promise<{ id: string }>
    publishReel(accessToken: string, igUserId: string, videoUrl: string, caption: string): Promise<{ id: string }>
    publishStory(accessToken: string, igUserId: string, mediaUrl: string): Promise<{ id: string }>
    getMediaInsights(accessToken: string, mediaId: string): Promise<InstagramMetricsJson | null>
    getAccountInfo(accessToken: string, igUserId: string): Promise<{ followers_count: number; media_count: number } | null>
    exchangeCodeForToken(code: string, redirectUri: string): Promise<{ access_token: string; user_id: string } | null>
    getLongLivedToken(shortToken: string): Promise<{ access_token: string; expires_in: number } | null>
    refreshLongLivedToken(currentToken: string): Promise<{ access_token: string; expires_in: number } | null>
    revokeToken(token: string): Promise<void>
    getInstagramBusinessAccount(userAccessToken: string): Promise<{ ig_user_id: string; ig_username: string; page_id: string; page_access_token: string; followers_count: number; media_count: number } | null>
}

export interface IInstagramAutoConfigRepository {
    findByOrgId(orgId: string): Promise<InstagramAutoConfigRow | null>
    upsert(orgId: string, data: Partial<Omit<InstagramAutoConfigRow, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>): Promise<InstagramAutoConfigRow | null>
    toggleActive(orgId: string, active: boolean): Promise<boolean>
}

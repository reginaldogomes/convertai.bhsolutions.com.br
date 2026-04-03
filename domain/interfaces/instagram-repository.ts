import type { InstagramContent } from '@/domain/entities/instagram-content'
import type { InstagramContentRow, InstagramContentStatus, InstagramAccountRow, InstagramMetricsJson, InstagramAutoConfigRow } from '@/types/instagram'

export interface CreateInstagramContentInput {
    organizationId: string
    type: string
    caption: string
    mediaUrls: string[]
    thumbnailUrl?: string | null
    hashtags?: string[]
}

export interface UpdateInstagramContentInput {
    caption?: string
    mediaUrls?: string[]
    thumbnailUrl?: string | null
    hashtags?: string[]
    type?: string
}

export interface IInstagramContentRepository {
    findById(id: string): Promise<InstagramContent | null>
    findByOrgId(orgId: string): Promise<InstagramContentRow[]>
    create(input: CreateInstagramContentInput): Promise<InstagramContent | null>
    update(id: string, orgId: string, input: UpdateInstagramContentInput): Promise<InstagramContent | null>
    updateStatus(id: string, orgId: string, status: InstagramContentStatus, extra?: Record<string, unknown>): Promise<boolean>
    delete(id: string, orgId: string): Promise<boolean>
    countByOrgId(orgId: string): Promise<number>
}

export interface IInstagramAccountRepository {
    findByOrgId(orgId: string): Promise<InstagramAccountRow | null>
    upsert(orgId: string, data: Omit<InstagramAccountRow, 'id' | 'organization_id' | 'connected_at'>): Promise<boolean>
    delete(orgId: string): Promise<boolean>
}

export interface IInstagramService {
    publishPost(accessToken: string, igUserId: string, imageUrl: string, caption: string): Promise<{ id: string } | null>
    publishCarousel(accessToken: string, igUserId: string, mediaUrls: string[], caption: string): Promise<{ id: string } | null>
    publishReel(accessToken: string, igUserId: string, videoUrl: string, caption: string): Promise<{ id: string } | null>
    publishStory(accessToken: string, igUserId: string, mediaUrl: string): Promise<{ id: string } | null>
    getMediaInsights(accessToken: string, mediaId: string): Promise<InstagramMetricsJson | null>
    getAccountInfo(accessToken: string, igUserId: string): Promise<{ followers_count: number; media_count: number } | null>
    exchangeCodeForToken(code: string, redirectUri: string): Promise<{ access_token: string; user_id: string } | null>
    getLongLivedToken(shortToken: string): Promise<{ access_token: string; expires_in: number } | null>
    getInstagramBusinessAccount(userAccessToken: string): Promise<{ ig_user_id: string; ig_username: string; page_id: string; page_access_token: string; followers_count: number; media_count: number } | null>
}

export interface IInstagramAutoConfigRepository {
    findByOrgId(orgId: string): Promise<InstagramAutoConfigRow | null>
    upsert(orgId: string, data: Partial<Omit<InstagramAutoConfigRow, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>): Promise<InstagramAutoConfigRow | null>
    toggleActive(orgId: string, active: boolean): Promise<boolean>
}

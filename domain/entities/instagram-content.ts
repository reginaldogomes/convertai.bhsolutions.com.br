import type { InstagramContentType, InstagramContentStatus, InstagramMetricsJson } from '@/types/instagram'

export interface InstagramContentProps {
    id: string
    organizationId: string
    type: InstagramContentType
    caption: string
    mediaUrls: string[]
    thumbnailUrl: string | null
    hashtags: string[]
    status: InstagramContentStatus
    scheduledAt: string | null
    publishedAt: string | null
    igPostId: string | null
    metrics: InstagramMetrics
    createdAt: string
}

export interface InstagramMetrics {
    likes: number
    comments: number
    shares: number
    saves: number
    reach: number
    impressions: number
    engagement_rate: number
}

const DEFAULT_METRICS: InstagramMetrics = {
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    reach: 0,
    impressions: 0,
    engagement_rate: 0,
}

export class InstagramContent {
    constructor(public readonly props: InstagramContentProps) {}

    get id() { return this.props.id }
    get organizationId() { return this.props.organizationId }
    get type() { return this.props.type }
    get caption() { return this.props.caption }
    get mediaUrls() { return this.props.mediaUrls }
    get thumbnailUrl() { return this.props.thumbnailUrl }
    get hashtags() { return this.props.hashtags }
    get status() { return this.props.status }
    get scheduledAt() { return this.props.scheduledAt }
    get publishedAt() { return this.props.publishedAt }
    get igPostId() { return this.props.igPostId }
    get metrics() { return this.props.metrics }
    get createdAt() { return this.props.createdAt }

    isDraft(): boolean {
        return this.status === 'draft'
    }

    isPublished(): boolean {
        return this.status === 'published'
    }

    isScheduled(): boolean {
        return this.status === 'scheduled'
    }

    canPublish(): boolean {
        return this.isDraft() && this.mediaUrls.length > 0
    }

    canSchedule(): boolean {
        return this.isDraft() && this.mediaUrls.length > 0
    }

    static fromRow(row: {
        id: string
        organization_id: string
        type: string
        caption: string
        media_urls: string[]
        thumbnail_url: string | null
        hashtags: string[]
        status: string
        scheduled_at: string | null
        published_at: string | null
        ig_post_id: string | null
        metrics: unknown
        created_at: string
    }): InstagramContent {
        const rawMetrics = row.metrics as Record<string, number> | null
        return new InstagramContent({
            id: row.id,
            organizationId: row.organization_id,
            type: row.type as InstagramContentType,
            caption: row.caption,
            mediaUrls: row.media_urls ?? [],
            thumbnailUrl: row.thumbnail_url,
            hashtags: row.hashtags ?? [],
            status: row.status as InstagramContentStatus,
            scheduledAt: row.scheduled_at,
            publishedAt: row.published_at,
            igPostId: row.ig_post_id,
            metrics: {
                likes: rawMetrics?.likes ?? 0,
                comments: rawMetrics?.comments ?? 0,
                shares: rawMetrics?.shares ?? 0,
                saves: rawMetrics?.saves ?? 0,
                reach: rawMetrics?.reach ?? 0,
                impressions: rawMetrics?.impressions ?? 0,
                engagement_rate: rawMetrics?.engagement_rate ?? 0,
            },
            createdAt: row.created_at,
        })
    }
}

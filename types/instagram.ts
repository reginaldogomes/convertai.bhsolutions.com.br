export type InstagramContentType = 'post' | 'story' | 'reel' | 'carousel'
export type InstagramContentStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'
export type HashtagStrategy = 'trending' | 'niche' | 'branded' | 'mix'

export interface InstagramContentRow {
    id: string
    organization_id: string
    type: InstagramContentType
    caption: string
    media_urls: string[]
    thumbnail_url: string | null
    hashtags: string[]
    status: InstagramContentStatus
    scheduled_at: string | null
    published_at: string | null
    ig_post_id: string | null
    metrics: InstagramMetricsJson
    created_at: string
}

export interface InstagramMetricsJson {
    likes: number
    comments: number
    shares: number
    saves: number
    reach: number
    impressions: number
    engagement_rate: number
}

export interface InstagramAccountRow {
    id: string
    organization_id: string
    ig_user_id: string
    ig_username: string
    access_token: string
    token_expires_at: string
    page_id: string
    followers_count: number
    media_count: number
    connected_at: string
}

export interface InstagramAutoConfigRow {
    id: string
    organization_id: string
    active: boolean
    niche: string
    brand_description: string
    target_audience: string
    tone: string
    language: string
    content_types: string[]
    objectives: string[]
    posts_per_week: number
    hashtag_strategy: HashtagStrategy
    default_hashtags: string[]
    visual_style: string
    cta_style: string
    avoid_topics: string
    reference_profiles: string[]
    created_at: string
    updated_at: string
}

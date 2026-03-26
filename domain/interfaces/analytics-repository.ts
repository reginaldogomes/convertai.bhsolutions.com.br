import type { AnalyticsEventType } from '@/types/database'

export interface TrackEventInput {
    landingPageId: string
    eventType: AnalyticsEventType
    sessionId?: string
    visitorId?: string
    metadata?: Record<string, unknown>
}

export interface PageAnalyticsSummary {
    totalViews: number
    totalChatStarts: number
    totalLeads: number
    totalCtaClicks: number
}

export interface IAnalyticsRepository {
    track(input: TrackEventInput): Promise<void>
    getSummary(pageId: string): Promise<PageAnalyticsSummary>
    getSummaryByOrg(orgId: string): Promise<PageAnalyticsSummary>
}

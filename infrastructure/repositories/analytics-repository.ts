import { createAdminClient } from '@/lib/supabase/admin'
import type { IAnalyticsRepository, TrackEventInput, PageAnalyticsSummary } from '@/domain/interfaces'

export class SupabaseAnalyticsRepository implements IAnalyticsRepository {
    async track(input: TrackEventInput): Promise<void> {
        const supabase = createAdminClient()
        await supabase.from('page_analytics').insert({
            landing_page_id: input.landingPageId,
            event_type: input.eventType,
            session_id: input.sessionId ?? null,
            visitor_id: input.visitorId ?? null,
            metadata_json: (input.metadata ?? {}) as Record<string, string>,
        })
    }

    async getSummary(pageId: string): Promise<PageAnalyticsSummary> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('page_analytics')
            .select('event_type')
            .eq('landing_page_id', pageId)

        return this.aggregateEvents(data ?? [])
    }

    async getSummaryByOrg(orgId: string): Promise<PageAnalyticsSummary> {
        const supabase = createAdminClient()

        // Get all landing page IDs for this org
        const { data: pages } = await supabase
            .from('landing_pages')
            .select('id')
            .eq('organization_id', orgId)

        if (!pages || pages.length === 0) {
            return { totalViews: 0, totalChatStarts: 0, totalLeads: 0, totalCtaClicks: 0 }
        }

        const pageIds = pages.map(p => p.id)
        const { data } = await supabase
            .from('page_analytics')
            .select('event_type')
            .in('landing_page_id', pageIds)

        return this.aggregateEvents(data ?? [])
    }

    private aggregateEvents(events: Array<{ event_type: string }>): PageAnalyticsSummary {
        const summary: PageAnalyticsSummary = {
            totalViews: 0,
            totalChatStarts: 0,
            totalLeads: 0,
            totalCtaClicks: 0,
        }
        for (const e of events) {
            switch (e.event_type) {
                case 'view': summary.totalViews++; break
                case 'chat_start': summary.totalChatStarts++; break
                case 'lead_captured': summary.totalLeads++; break
                case 'cta_click': summary.totalCtaClicks++; break
            }
        }
        return summary
    }
}

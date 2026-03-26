import { analyticsRepo } from '@/application/services/container'
import type { AnalyticsEventType } from '@/types/database'

const ALLOWED_EVENTS: AnalyticsEventType[] = ['view', 'chat_start', 'cta_click']

export async function POST(req: Request) {
    const body = await req.json()
    const { landingPageId, eventType, visitorId } = body as {
        landingPageId: string
        eventType: string
        visitorId: string
    }

    if (!landingPageId || !eventType || !visitorId) {
        return Response.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (!ALLOWED_EVENTS.includes(eventType as AnalyticsEventType)) {
        return Response.json({ error: 'Invalid event type' }, { status: 400 })
    }

    await analyticsRepo.track({
        landingPageId,
        eventType: eventType as AnalyticsEventType,
        visitorId,
    })

    return Response.json({ ok: true })
}

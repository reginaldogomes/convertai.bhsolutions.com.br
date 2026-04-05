import { analyticsRepo } from '@/application/services/container'
import type { AnalyticsEventType } from '@/types/database'
import { enqueueAdsConversion, flushAdsConversionOutbox } from '@/lib/ads-conversion-outbox'

const ALLOWED_EVENTS: AnalyticsEventType[] = ['view', 'chat_start', 'cta_click']

export async function POST(req: Request) {
    const body = await req.json()
    const { landingPageId, eventType, visitorId, metadata } = body as {
        landingPageId: string
        eventType: string
        visitorId: string
        metadata?: Record<string, unknown>
    }

    if (!landingPageId || !eventType || !visitorId) {
        return Response.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (!ALLOWED_EVENTS.includes(eventType as AnalyticsEventType)) {
        return Response.json({ error: 'Invalid event type' }, { status: 400 })
    }

    const enrichedMetadata = {
        ...(metadata ?? {}),
        eventId: typeof metadata?.eventId === 'string' ? metadata.eventId : crypto.randomUUID(),
    }

    await analyticsRepo.track({
        landingPageId,
        eventType: eventType as AnalyticsEventType,
        visitorId,
        metadata: enrichedMetadata,
    })

    await enqueueAdsConversion({
        landingPageId,
        eventType: eventType as AnalyticsEventType,
        visitorId,
        metadata: enrichedMetadata,
    })

    void flushAdsConversionOutbox({ limit: 10, requestHeaders: req.headers })

    return Response.json({ ok: true })
}

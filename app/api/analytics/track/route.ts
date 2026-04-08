import { analyticsRepo } from '@/application/services/container'
import type { AnalyticsEventType } from '@/types/database'
import { enqueueAdsConversion, flushAdsConversionOutbox } from '@/lib/ads-conversion-outbox'
import { createApiRequestLogger, jsonWithRequestId } from '@/lib/api-observability'
import { z } from 'zod'

const ALLOWED_EVENTS: AnalyticsEventType[] = ['view', 'chat_start', 'cta_click']

const analyticsTrackSchema = z.object({
    landingPageId: z.string().uuid(),
    eventType: z.enum(ALLOWED_EVENTS),
    visitorId: z.string().min(1).max(255),
    metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(req: Request) {
    const logger = createApiRequestLogger('analytics/track')

    try {
        const parsed = analyticsTrackSchema.safeParse(await req.json())
        if (!parsed.success) {
            return jsonWithRequestId(
                logger.requestId,
                {
                    error: 'Invalid payload',
                    requestId: logger.requestId,
                    details: parsed.error.issues.map((issue) => ({
                        path: issue.path.join('.'),
                        message: issue.message,
                    })),
                },
                { status: 400 }
            )
        }

        const { landingPageId, eventType, visitorId, metadata } = parsed.data

        const enrichedMetadata = {
            ...(metadata ?? {}),
            eventId: typeof metadata?.eventId === 'string' ? metadata.eventId : crypto.randomUUID(),
        }

        await analyticsRepo.track({
            landingPageId,
            eventType,
            visitorId,
            metadata: enrichedMetadata,
        })

        await enqueueAdsConversion({
            landingPageId,
            eventType,
            visitorId,
            metadata: enrichedMetadata,
        })

        void flushAdsConversionOutbox({ limit: 10, requestHeaders: req.headers })

        logger.log('event_tracked', { landingPageId, eventType })
        return jsonWithRequestId(logger.requestId, { ok: true, requestId: logger.requestId })
    } catch (error) {
        logger.error('track_failed', error)
        return jsonWithRequestId(
            logger.requestId,
            { error: 'Failed to track analytics event', requestId: logger.requestId },
            { status: 500 }
        )
    }
}

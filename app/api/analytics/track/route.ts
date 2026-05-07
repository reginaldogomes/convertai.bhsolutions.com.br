import { analyticsRepo } from '@/application/services/container'
import type { AnalyticsEventType } from '@/types/database'
import { enqueueAdsConversion, flushAdsConversionOutbox } from '@/lib/ads-conversion-outbox'
import { createApiRequestLogger, jsonWithRequestId } from '@/lib/api-observability'
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit'
import { z } from 'zod'

const ALLOWED_EVENTS: AnalyticsEventType[] = ['view', 'chat_start', 'cta_click']
const ANALYTICS_RATE_LIMIT_MAX = 120
const ANALYTICS_RATE_LIMIT_WINDOW_MS = 60_000

const analyticsTrackSchema = z.object({
    landingPageId: z.string().uuid(),
    eventType: z.enum(ALLOWED_EVENTS),
    visitorId: z.string().min(1).max(255),
    metadata: z.record(z.string().max(100), z.union([z.string().max(1000), z.number(), z.boolean(), z.null()]))
        .refine(val => JSON.stringify(val).length <= 4096, 'Metadata excede o limite permitido')
        .optional(),
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
        const clientIp = getClientIp(req.headers)
        const rateLimit = checkRateLimit(
            `analytics:${landingPageId}:${clientIp}:${visitorId}`,
            { intervalMs: ANALYTICS_RATE_LIMIT_WINDOW_MS, maxRequests: ANALYTICS_RATE_LIMIT_MAX }
        )
        if (!rateLimit.allowed) {
            return jsonWithRequestId(
                logger.requestId,
                { error: 'Too many analytics events', requestId: logger.requestId },
                { status: 429, headers: rateLimitHeaders(rateLimit, ANALYTICS_RATE_LIMIT_MAX) }
            )
        }

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
        return jsonWithRequestId(
            logger.requestId,
            { ok: true, requestId: logger.requestId },
            { headers: rateLimitHeaders(rateLimit, ANALYTICS_RATE_LIMIT_MAX) }
        )
    } catch (error) {
        logger.error('track_failed', error)
        return jsonWithRequestId(
            logger.requestId,
            { error: 'Failed to track analytics event', requestId: logger.requestId },
            { status: 500 }
        )
    }
}

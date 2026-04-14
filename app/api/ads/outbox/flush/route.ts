import { NextResponse } from 'next/server'
import { flushAdsConversionOutbox } from '@/lib/ads-conversion-outbox'
import { createApiRequestLogger, jsonWithRequestId } from '@/lib/api-observability'
import { z } from 'zod'

const flushSchema = z.object({
    limit: z.number().int().min(1).max(500).optional(),
})

function unauthorized(requestId: string) {
    return jsonWithRequestId(requestId, { ok: false, error: 'Unauthorized', requestId }, { status: 401 })
}

export async function POST(req: Request) {
    const logger = createApiRequestLogger('ads/outbox/flush')

    try {
        const cronSecret = process.env.ADS_OUTBOX_CRON_SECRET
        if (!cronSecret || req.headers.get('x-ads-outbox-secret') !== cronSecret) {
            return unauthorized(logger.requestId)
        }

        const parsed = flushSchema.safeParse(await req.json().catch(() => ({})))
        if (!parsed.success) {
            return jsonWithRequestId(
                logger.requestId,
                {
                    ok: false,
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

        const sent = await flushAdsConversionOutbox({
            limit: parsed.data.limit,
            requestHeaders: req.headers,
        })

        logger.log('flush_completed', { sent })
        return jsonWithRequestId(logger.requestId, { ok: true, sent })
    } catch (error) {
        logger.error('flush_failed', error)
        return jsonWithRequestId(
            logger.requestId,
            { ok: false, error: 'Unknown error', requestId: logger.requestId },
            { status: 500 }
        )
    }
}

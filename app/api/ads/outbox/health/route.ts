import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createApiRequestLogger, jsonWithRequestId } from '@/lib/api-observability'

function unauthorized(requestId: string) {
    return jsonWithRequestId(requestId, { ok: false, error: 'Unauthorized', requestId }, { status: 401 })
}

function isMissingOutboxTableError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false

    const maybe = error as { code?: string; message?: string }
    if (maybe.code === 'PGRST205') return true

    return typeof maybe.message === 'string' && maybe.message.includes('ads_conversion_outbox')
}

export async function GET(req: Request) {
    const logger = createApiRequestLogger('ads/outbox/health')

    try {
        const cronSecret = process.env.ADS_OUTBOX_CRON_SECRET
        if (!cronSecret || req.headers.get('x-ads-outbox-secret') !== cronSecret) {
            return unauthorized(logger.requestId)
        }

        const supabase = createAdminClient()
        const { error } = await supabase
            .from('ads_conversion_outbox')
            .select('id', { count: 'exact', head: true })
            .limit(1)

        if (!error) {
            return jsonWithRequestId(logger.requestId, {
                ok: true,
                outbox: {
                    tableAvailable: true,
                },
            })
        }

        if (isMissingOutboxTableError(error)) {
            return jsonWithRequestId(logger.requestId, {
                ok: false,
                requestId: logger.requestId,
                outbox: {
                    tableAvailable: false,
                    code: error.code ?? 'PGRST205',
                    message: "Table public.ads_conversion_outbox not found. Apply migration 013_ads_conversion_outbox.sql.",
                },
            })
        }

        return jsonWithRequestId(logger.requestId, {
            ok: false,
            requestId: logger.requestId,
            outbox: {
                tableAvailable: false,
                code: error.code ?? 'UNKNOWN',
                message: error.message ?? 'Unknown outbox health error',
            },
        }, { status: 500 })
    } catch (error) {
        logger.error('health_failed', error)
        return jsonWithRequestId(
            logger.requestId,
            { ok: false, error: 'Unknown error', requestId: logger.requestId },
            { status: 500 }
        )
    }
}

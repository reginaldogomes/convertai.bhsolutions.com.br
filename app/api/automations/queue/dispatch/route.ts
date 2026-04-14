import { NextResponse } from 'next/server'
import { processAutomationQueue } from '@/lib/automation-dispatcher'
import { createApiRequestLogger, jsonWithRequestId } from '@/lib/api-observability'

function unauthorized(requestId: string) {
    return jsonWithRequestId(requestId, { ok: false, error: 'Unauthorized', requestId }, { status: 401 })
}

function authorize(req: Request): boolean {
    const secret = process.env.AUTOMATION_QUEUE_CRON_SECRET
    if (!secret) return false // fail-closed: deny if secret not configured

    const headerSecret = req.headers.get('x-automation-queue-secret')
    if (headerSecret === secret) return true

    const authHeader = req.headers.get('authorization') || ''
    if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice('Bearer '.length).trim()
        return token === secret
    }

    return false
}

export async function POST(req: Request) {
    const logger = createApiRequestLogger('automations/queue/dispatch')

    if (!authorize(req)) return unauthorized(logger.requestId)

    try {
        const processed = await processAutomationQueue({ limit: 50 })
        logger.log('queue_processed', { processed: processed.processed })
        return jsonWithRequestId(logger.requestId, { ok: true, processed: processed.processed })
    } catch (error) {
        logger.error('dispatch_failed', error)
        return jsonWithRequestId(
            logger.requestId,
            {
                ok: false,
                error: 'Unknown queue error',
                requestId: logger.requestId,
            },
            { status: 500 }
        )
    }
}

export async function GET(req: Request) {
    return POST(req)
}

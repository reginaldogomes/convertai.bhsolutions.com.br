import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

function isMissingQueueTableError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false

    const maybe = error as { code?: string; message?: string }
    if (maybe.code === 'PGRST205') return true

    return typeof maybe.message === 'string' && maybe.message.includes('automation_job_queue')
}

export async function GET(req: Request) {
    const logger = createApiRequestLogger('automations/queue/health')
    if (!authorize(req)) return unauthorized(logger.requestId)

    try {
        const supabase = createAdminClient()

        const [pendingRes, processingRes, doneRes, failedRes, nextPendingRes, lastFailedRes] = await Promise.all([
            supabase
                .from('automation_job_queue')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'pending'),
            supabase
                .from('automation_job_queue')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'processing'),
            supabase
                .from('automation_job_queue')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'done'),
            supabase
                .from('automation_job_queue')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'failed'),
            supabase
                .from('automation_job_queue')
                .select('id, execute_after, attempts, max_attempts, updated_at')
                .eq('status', 'pending')
                .order('execute_after', { ascending: true })
                .limit(1)
                .maybeSingle(),
            supabase
                .from('automation_job_queue')
                .select('id, last_error, attempts, max_attempts, updated_at')
                .eq('status', 'failed')
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle(),
        ])

        const firstError = [pendingRes.error, processingRes.error, doneRes.error, failedRes.error, nextPendingRes.error, lastFailedRes.error]
            .find((error) => !!error)

        if (firstError) {
            if (isMissingQueueTableError(firstError)) {
                return jsonWithRequestId(logger.requestId, {
                    ok: false,
                    requestId: logger.requestId,
                    queue: {
                        tableAvailable: false,
                        code: 'PGRST205',
                        message: 'Table public.automation_job_queue not found. Apply migration 014_automation_runtime.sql.',
                    },
                })
            }

            return jsonWithRequestId(logger.requestId, {
                ok: false,
                requestId: logger.requestId,
                error: firstError.message,
                queue: {
                    tableAvailable: true,
                },
            }, { status: 500 })
        }

        return jsonWithRequestId(logger.requestId, {
            ok: true,
            queue: {
                tableAvailable: true,
                counts: {
                    pending: pendingRes.count ?? 0,
                    processing: processingRes.count ?? 0,
                    done: doneRes.count ?? 0,
                    failed: failedRes.count ?? 0,
                },
                nextPending: nextPendingRes.data ?? null,
                lastFailed: lastFailedRes.data ?? null,
                checkedAt: new Date().toISOString(),
            },
        })
    } catch (error) {
        logger.error('health_failed', error)
        return jsonWithRequestId(
            logger.requestId,
            { ok: false, error: 'Unknown error', requestId: logger.requestId },
            { status: 500 }
        )
    }
}

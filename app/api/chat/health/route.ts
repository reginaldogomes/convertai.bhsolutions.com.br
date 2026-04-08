import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createApiRequestLogger, jsonWithRequestId } from '@/lib/api-observability'

function unauthorized(requestId: string) {
    return jsonWithRequestId(requestId, { ok: false, error: 'Unauthorized', requestId }, { status: 401 })
}

function authorize(req: Request): boolean {
    const secret = process.env.CHAT_HEALTH_SECRET
    if (!secret) return true

    const headerSecret = req.headers.get('x-chat-health-secret')
    if (headerSecret === secret) return true

    const authHeader = req.headers.get('authorization') || ''
    if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice('Bearer '.length).trim()
        return token === secret
    }

    return false
}

function isMissingChatTableError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false

    const maybe = error as { code?: string; message?: string }
    if (maybe.code === 'PGRST205') return true

    return typeof maybe.message === 'string'
        && (maybe.message.includes('chat_sessions') || maybe.message.includes('chat_messages'))
}

export async function GET(req: Request) {
    const logger = createApiRequestLogger('chat/health')

    if (!authorize(req)) return unauthorized(logger.requestId)

    try {
        const supabase = createAdminClient()
        const url = new URL(req.url)
        const includeDetails = url.searchParams.get('details') === '1'

        const now = Date.now()
        const oneMinuteAgoIso = new Date(now - 60 * 1000).toISOString()
        const fiveMinutesAgoIso = new Date(now - 5 * 60 * 1000).toISOString()

        const [
            activeSessionsRes,
            leadSessionsRes,
            closedSessionsRes,
            totalSessionsRes,
            totalMessagesRes,
            userMessages1mRes,
            assistantMessages1mRes,
            sessionsStarted1mRes,
            leadsCaptured1mRes,
            sessionsStarted5mRes,
            leadsCaptured5mRes,
            recentSessionsRes,
            recentMessagesRes,
        ] = await Promise.all([
            supabase
                .from('chat_sessions')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'active'),
            supabase
                .from('chat_sessions')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'lead_captured'),
            supabase
                .from('chat_sessions')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'closed'),
            supabase
                .from('chat_sessions')
                .select('id', { count: 'exact', head: true }),
            supabase
                .from('chat_messages')
                .select('id', { count: 'exact', head: true }),
            supabase
                .from('chat_messages')
                .select('id', { count: 'exact', head: true })
                .eq('role', 'user')
                .gte('created_at', oneMinuteAgoIso),
            supabase
                .from('chat_messages')
                .select('id', { count: 'exact', head: true })
                .eq('role', 'assistant')
                .gte('created_at', oneMinuteAgoIso),
            supabase
                .from('chat_sessions')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', oneMinuteAgoIso),
            supabase
                .from('chat_sessions')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'lead_captured')
                .gte('updated_at', oneMinuteAgoIso),
            supabase
                .from('chat_sessions')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', fiveMinutesAgoIso),
            supabase
                .from('chat_sessions')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'lead_captured')
                .gte('updated_at', fiveMinutesAgoIso),
            includeDetails
                ? supabase
                    .from('chat_sessions')
                    .select('id, landing_page_id, visitor_id, contact_id, status, created_at, updated_at')
                    .order('updated_at', { ascending: false })
                    .limit(10)
                : Promise.resolve({ data: null, error: null }),
            includeDetails
                ? supabase
                    .from('chat_messages')
                    .select('id, session_id, role, content, created_at')
                    .order('created_at', { ascending: false })
                    .limit(10)
                : Promise.resolve({ data: null, error: null }),
        ])

        const firstError = [
            activeSessionsRes.error,
            leadSessionsRes.error,
            closedSessionsRes.error,
            totalSessionsRes.error,
            totalMessagesRes.error,
            userMessages1mRes.error,
            assistantMessages1mRes.error,
            sessionsStarted1mRes.error,
            leadsCaptured1mRes.error,
            sessionsStarted5mRes.error,
            leadsCaptured5mRes.error,
            recentSessionsRes.error,
            recentMessagesRes.error,
        ].find(error => !!error)

        if (firstError) {
            if (isMissingChatTableError(firstError)) {
                return jsonWithRequestId(logger.requestId, {
                    ok: false,
                    requestId: logger.requestId,
                    chat: {
                        tablesAvailable: false,
                        code: 'PGRST205',
                        message: 'Chat tables not found. Apply migration 004_landing_pages_and_chat.sql.',
                    },
                })
            }

            return jsonWithRequestId(logger.requestId, {
                ok: false,
                requestId: logger.requestId,
                error: firstError.message,
                chat: {
                    tablesAvailable: true,
                },
            }, { status: 500 })
        }

        const activeSessions = activeSessionsRes.count ?? 0
        const leadCapturedSessions = leadSessionsRes.count ?? 0
        const closedSessions = closedSessionsRes.count ?? 0
        const totalSessions = totalSessionsRes.count ?? 0
        const totalMessages = totalMessagesRes.count ?? 0

        return jsonWithRequestId(logger.requestId, {
            ok: true,
            chat: {
                tablesAvailable: true,
                counts: {
                    activeSessions,
                    leadCapturedSessions,
                    closedSessions,
                    totalSessions,
                    totalMessages,
                },
                throughput: {
                    last1m: {
                        userMessages: userMessages1mRes.count ?? 0,
                        assistantMessages: assistantMessages1mRes.count ?? 0,
                        sessionsStarted: sessionsStarted1mRes.count ?? 0,
                        leadsCaptured: leadsCaptured1mRes.count ?? 0,
                    },
                    last5m: {
                        sessionsStarted: sessionsStarted5mRes.count ?? 0,
                        leadsCaptured: leadsCaptured5mRes.count ?? 0,
                    },
                },
                leadCaptureRate: totalSessions > 0
                    ? Number(((leadCapturedSessions / totalSessions) * 100).toFixed(2))
                    : 0,
                details: includeDetails
                    ? {
                        recentSessions: recentSessionsRes.data ?? [],
                        recentMessages: recentMessagesRes.data ?? [],
                    }
                    : undefined,
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

import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchAdsConversion } from '@/lib/ads-conversions-dispatcher'
import type { AnalyticsEventType, Json } from '@/types/database'

type OutboxStatus = 'pending' | 'retrying' | 'processing' | 'sent' | 'failed'

interface EnqueueAdsConversionInput {
    landingPageId: string
    eventType: AnalyticsEventType
    visitorId?: string
    sessionId?: string
    metadata?: Record<string, unknown>
}

interface FlushAdsOutboxInput {
    limit?: number
    requestHeaders?: Headers
}

interface OutboxRow {
    id: string
    dedupe_key: string
    landing_page_id: string
    event_type: AnalyticsEventType
    session_id: string | null
    visitor_id: string | null
    metadata_json: Json
    status: OutboxStatus
    attempts: number
    max_attempts: number
}

let missingOutboxTableWarned = false

function hasMarketingConsent(metadata?: Record<string, unknown>): boolean {
    if (!metadata) return true
    if (typeof metadata.consentMarketing !== 'boolean') return true
    return metadata.consentMarketing
}

function asRecord(value: Json): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>
    }
    return {}
}

function resolveEventId(metadata?: Record<string, unknown>): string {
    const eventId = metadata?.eventId
    if (typeof eventId === 'string' && eventId.length > 0) return eventId
    return crypto.randomUUID()
}

function computeBackoffMinutes(attempts: number): number {
    if (attempts <= 1) return 1
    if (attempts === 2) return 5
    if (attempts === 3) return 15
    return 30
}

function isMissingOutboxTableError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false

    const maybe = error as { code?: string; message?: string }
    if (maybe.code === 'PGRST205') return true

    return typeof maybe.message === 'string' && maybe.message.includes('ads_conversion_outbox')
}

function warnMissingOutboxTableOnce() {
    if (missingOutboxTableWarned) return

    missingOutboxTableWarned = true
    console.warn('[ads-outbox] Table public.ads_conversion_outbox not found. Skipping outbox operations until migration is applied.')
}

export async function enqueueAdsConversion(input: EnqueueAdsConversionInput): Promise<string | null> {
    if (!hasMarketingConsent(input.metadata)) return null

    const supabase = createAdminClient()
    const eventId = resolveEventId(input.metadata)

    const { error } = await supabase
        .from('ads_conversion_outbox')
        .upsert({
            dedupe_key: eventId,
            landing_page_id: input.landingPageId,
            event_type: input.eventType,
            session_id: input.sessionId ?? null,
            visitor_id: input.visitorId ?? null,
            metadata_json: (input.metadata ?? {}) as Json,
            status: 'pending',
            next_retry_at: new Date().toISOString(),
        }, { onConflict: 'dedupe_key', ignoreDuplicates: true })

    if (error) {
        if (isMissingOutboxTableError(error)) {
            warnMissingOutboxTableOnce()
            return null
        }
        throw error
    }

    return eventId
}

export async function flushAdsConversionOutbox(input: FlushAdsOutboxInput = {}): Promise<number> {
    const supabase = createAdminClient()
    const nowIso = new Date().toISOString()
    const limit = Math.min(Math.max(input.limit ?? 20, 1), 100)

    const { data, error } = await supabase
        .from('ads_conversion_outbox')
        .select('id,dedupe_key,landing_page_id,event_type,session_id,visitor_id,metadata_json,status,attempts,max_attempts')
        .in('status', ['pending', 'retrying'])
        .lte('next_retry_at', nowIso)
        .order('created_at', { ascending: true })
        .limit(limit)

    if (error) {
        if (isMissingOutboxTableError(error)) {
            warnMissingOutboxTableOnce()
            return 0
        }
        throw error
    }

    let sentCount = 0

    for (const row of (data ?? []) as OutboxRow[]) {
        const { data: lockedRows } = await supabase
            .from('ads_conversion_outbox')
            .update({
                status: 'processing',
                locked_at: nowIso,
                updated_at: nowIso,
            })
            .eq('id', row.id)
            .in('status', ['pending', 'retrying'])
            .select('id')
            .limit(1)

        if (!lockedRows || lockedRows.length === 0) {
            continue
        }

        const metadata = asRecord(row.metadata_json)

        try {
            await dispatchAdsConversion({
                landingPageId: row.landing_page_id,
                eventType: row.event_type,
                visitorId: row.visitor_id ?? undefined,
                sessionId: row.session_id ?? undefined,
                metadata,
                requestHeaders: input.requestHeaders,
            })

            sentCount += 1

            await supabase
                .from('ads_conversion_outbox')
                .update({
                    status: 'sent',
                    attempts: row.attempts + 1,
                    last_error: null,
                    sent_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    locked_at: null,
                })
                .eq('id', row.id)
        } catch (error) {
            const nextAttempts = row.attempts + 1
            const exhausted = nextAttempts >= row.max_attempts
            const backoffMinutes = computeBackoffMinutes(nextAttempts)
            const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString()

            await supabase
                .from('ads_conversion_outbox')
                .update({
                    status: exhausted ? 'failed' : 'retrying',
                    attempts: nextAttempts,
                    last_error: error instanceof Error ? error.message : 'Unknown dispatch error',
                    next_retry_at: exhausted ? nowIso : nextRetry,
                    updated_at: new Date().toISOString(),
                    locked_at: null,
                })
                .eq('id', row.id)
        }
    }

    return sentCount
}

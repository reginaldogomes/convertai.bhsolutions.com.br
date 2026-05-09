/**
 * Meta Instagram Webhook
 *
 * GET  — Verification challenge (Meta calls this once when you set up the webhook)
 * POST — Event handler (comments, mentions, story insights, etc.)
 *
 * Required env vars:
 *   INSTAGRAM_WEBHOOK_VERIFY_TOKEN — arbitrary string you set in Meta dashboard
 *   INSTAGRAM_WEBHOOK_SECRET       — app secret for HMAC-SHA256 signature check
 */

import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'

const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN ?? ''
const WEBHOOK_SECRET = process.env.INSTAGRAM_WEBHOOK_SECRET ?? process.env.META_APP_SECRET ?? ''

// ─── GET — Verification challenge ─────────────────────────────────────────────

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[instagram/webhook] Verification challenge accepted')
        return new Response(challenge ?? '', { status: 200 })
    }

    console.warn('[instagram/webhook] Verification challenge failed', { mode, token })
    return new Response('Forbidden', { status: 403 })
}

// ─── POST — Event handler ──────────────────────────────────────────────────────

export async function POST(request: Request) {
    try {
        const rawBody = await request.text()

        // Verify HMAC-SHA256 signature
        const signature = request.headers.get('x-hub-signature-256') ?? ''
        if (!verifySignature(rawBody, signature)) {
            console.warn('[instagram/webhook] Invalid signature — request rejected')
            return new Response('Unauthorized', { status: 401 })
        }

        const payload = JSON.parse(rawBody) as WebhookPayload
        console.log('[instagram/webhook] Event received', { object: payload.object, entries: payload.entry?.length })

        // Process each entry asynchronously (don't block the 200 response)
        processEntries(payload).catch(err =>
            console.error('[instagram/webhook] processEntries error', err)
        )

        return new Response('OK', { status: 200 })
    } catch (err) {
        console.error('[instagram/webhook] Handler error', err)
        // Always return 200 to Meta — otherwise it will retry
        return NextResponse.json({ ok: false }, { status: 200 })
    }
}

// ─── Signature verification ────────────────────────────────────────────────────

function verifySignature(body: string, signature: string): boolean {
    if (!WEBHOOK_SECRET || !signature.startsWith('sha256=')) return false
    const expected = createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')
    const received = signature.replace('sha256=', '')
    // Constant-time comparison to prevent timing attacks
    try {
        const { timingSafeEqual } = require('crypto') as typeof import('crypto')
        return timingSafeEqual(Buffer.from(expected), Buffer.from(received))
    } catch {
        return expected === received
    }
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface WebhookPayload {
    object: string
    entry?: WebhookEntry[]
}

interface WebhookEntry {
    id: string
    time: number
    changes?: WebhookChange[]
    messaging?: WebhookMessaging[]
}

interface WebhookChange {
    field: string
    value: Record<string, unknown>
}

interface WebhookMessaging {
    sender: { id: string }
    recipient: { id: string }
    timestamp: number
    message?: { mid: string; text?: string }
}

// ─── Event processing ──────────────────────────────────────────────────────────

async function processEntries(payload: WebhookPayload): Promise<void> {
    if (payload.object !== 'instagram' && payload.object !== 'page') return

    for (const entry of payload.entry ?? []) {
        for (const change of entry.changes ?? []) {
            await handleChange(entry.id, change)
        }
    }
}

async function handleChange(pageId: string, change: WebhookChange): Promise<void> {
    switch (change.field) {
        case 'comments':
            console.log('[instagram/webhook] New comment', { pageId, value: change.value })
            // TODO: store comment, notify org via toast/notification
            break

        case 'mentions':
            console.log('[instagram/webhook] New mention', { pageId, value: change.value })
            // TODO: store mention for moderation queue
            break

        case 'story_insights':
            console.log('[instagram/webhook] Story insights', { pageId, value: change.value })
            // TODO: update story metrics in instagram_contents
            break

        case 'feed':
            console.log('[instagram/webhook] Feed update', { pageId, value: change.value })
            break

        default:
            console.log('[instagram/webhook] Unhandled field', { field: change.field, pageId })
    }
}

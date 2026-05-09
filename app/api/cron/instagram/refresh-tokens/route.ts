/**
 * Cron: Refresh Instagram long-lived tokens approaching expiry.
 *
 * Run every 30 days (e.g. Vercel Cron: `0 4 */30 * *`).
 * Secured with CRON_SECRET to prevent unauthorized calls.
 *
 * Refresh window: tokens expiring within 15 days are refreshed.
 */

import { NextResponse } from 'next/server'
import { useCases } from '@/application/services/container'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function isAuthorized(request: Request): boolean {
    const secret = process.env.CRON_SECRET
    if (!secret) return false
    const auth = request.headers.get('authorization') ?? ''
    return auth === `Bearer ${secret}`
}

export async function POST(request: Request) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const result = await useCases.refreshInstagramTokens().execute(15)
        console.log('[cron/instagram/refresh-tokens] Done', result)
        return NextResponse.json({ ok: true, ...result })
    } catch (err) {
        console.error('[cron/instagram/refresh-tokens] Error', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

// Allow Vercel Cron (GET) as well
export { POST as GET }

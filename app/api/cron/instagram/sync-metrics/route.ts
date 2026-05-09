// Cron: Sync Instagram metrics for recently published posts.
// Schedule: every 6 hours  →  "0 * /6 * * *"  (vercel.json)
// Syncs likes, comments, shares, saves, reach and impressions
// for posts published in the last 7 days.

import { NextResponse } from 'next/server'
import { useCases } from '@/application/services/container'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

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
        const result = await useCases.syncAllMetrics().execute(168) // last 7 days
        console.log('[cron/instagram/sync-metrics] Done', result)
        return NextResponse.json({ ok: true, ...result })
    } catch (err) {
        console.error('[cron/instagram/sync-metrics] Error', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

export { POST as GET }

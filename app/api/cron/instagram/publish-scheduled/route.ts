/**
 * Cron: Publish scheduled Instagram posts.
 *
 * Run every 5–15 minutes (e.g. Vercel Cron: `*/15 * * * *`).
 * Finds all posts with status='scheduled' AND scheduled_at <= now()
 * and publishes them via the Meta Graph API.
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
        const result = await useCases.publishScheduledPosts().execute()
        console.log('[cron/instagram/publish-scheduled] Done', result)
        return NextResponse.json({ ok: true, ...result })
    } catch (err) {
        console.error('[cron/instagram/publish-scheduled] Error', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

export { POST as GET }

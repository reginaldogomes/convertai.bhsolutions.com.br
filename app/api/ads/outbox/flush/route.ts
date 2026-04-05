import { NextResponse } from 'next/server'
import { flushAdsConversionOutbox } from '@/lib/ads-conversion-outbox'

function unauthorized() {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
}

export async function POST(req: Request) {
    try {
        const cronSecret = process.env.ADS_OUTBOX_CRON_SECRET
        if (cronSecret) {
            const headerSecret = req.headers.get('x-ads-outbox-secret')
            if (headerSecret !== cronSecret) return unauthorized()
        }

        const body = await req.json().catch(() => ({})) as { limit?: number }
        const sent = await flushAdsConversionOutbox({
            limit: body.limit,
            requestHeaders: req.headers,
        })

        return NextResponse.json({ ok: true, sent })
    } catch (error) {
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

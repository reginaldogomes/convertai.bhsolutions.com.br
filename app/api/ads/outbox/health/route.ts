import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function unauthorized() {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
}

function isMissingOutboxTableError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false

    const maybe = error as { code?: string; message?: string }
    if (maybe.code === 'PGRST205') return true

    return typeof maybe.message === 'string' && maybe.message.includes('ads_conversion_outbox')
}

export async function GET(req: Request) {
    try {
        const cronSecret = process.env.ADS_OUTBOX_CRON_SECRET
        if (cronSecret) {
            const headerSecret = req.headers.get('x-ads-outbox-secret')
            if (headerSecret !== cronSecret) return unauthorized()
        }

        const supabase = createAdminClient()
        const { error } = await supabase
            .from('ads_conversion_outbox')
            .select('id', { count: 'exact', head: true })
            .limit(1)

        if (!error) {
            return NextResponse.json({
                ok: true,
                outbox: {
                    tableAvailable: true,
                },
            })
        }

        if (isMissingOutboxTableError(error)) {
            return NextResponse.json({
                ok: false,
                outbox: {
                    tableAvailable: false,
                    code: error.code ?? 'PGRST205',
                    message: "Table public.ads_conversion_outbox not found. Apply migration 013_ads_conversion_outbox.sql.",
                },
            })
        }

        return NextResponse.json({
            ok: false,
            outbox: {
                tableAvailable: false,
                code: error.code ?? 'UNKNOWN',
                message: error.message ?? 'Unknown outbox health error',
            },
        }, { status: 500 })
    } catch (error) {
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

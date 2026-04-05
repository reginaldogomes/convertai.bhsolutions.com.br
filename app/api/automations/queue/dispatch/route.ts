import { NextResponse } from 'next/server'
import { processAutomationQueue } from '@/lib/automation-dispatcher'

function unauthorized() {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
}

function authorize(req: Request): boolean {
    const secret = process.env.AUTOMATION_QUEUE_CRON_SECRET
    if (!secret) return true

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
    if (!authorize(req)) return unauthorized()

    try {
        const processed = await processAutomationQueue({ limit: 50 })
        return NextResponse.json({ ok: true, processed: processed.processed })
    } catch (error) {
        return NextResponse.json({
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown queue error',
        }, { status: 500 })
    }
}

export async function GET(req: Request) {
    return POST(req)
}

import { NextResponse } from 'next/server'
import { createApiRequestLogger, jsonWithRequestId } from '@/lib/api-observability'
import { z } from 'zod'

interface GoogleAdsWebhookEvent {
    event_name: string
    event_time: number
    event_id: string
    landing_page_id: string
    session_id?: string
    page_url?: string
    attribution?: Record<string, unknown>
    click_ids: {
        gclid?: string
        gbraid?: string
        wbraid?: string
        msclkid?: string
    }
    user: {
        external_id_hash?: string
        client_ip_address?: string
        client_user_agent?: string
    }
}

const googleAdsWebhookEventSchema = z.object({
    event_name: z.string().min(1),
    event_time: z.number().int().positive(),
    event_id: z.string().min(1),
    landing_page_id: z.string().uuid(),
    session_id: z.string().optional(),
    page_url: z.string().url().optional(),
    attribution: z.record(z.string(), z.unknown()).optional(),
    click_ids: z.object({
        gclid: z.string().optional(),
        gbraid: z.string().optional(),
        wbraid: z.string().optional(),
        msclkid: z.string().optional(),
    }),
    user: z.object({
        external_id_hash: z.string().optional(),
        client_ip_address: z.string().optional(),
        client_user_agent: z.string().optional(),
    }),
})

function unauthorized(requestId: string) {
    return jsonWithRequestId(requestId, { error: 'Unauthorized', requestId }, { status: 401 })
}

function formatGoogleDateTime(epochSeconds: number): string {
    const date = new Date(epochSeconds * 1000)
    const yyyy = date.getUTCFullYear()
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(date.getUTCDate()).padStart(2, '0')
    const hh = String(date.getUTCHours()).padStart(2, '0')
    const min = String(date.getUTCMinutes()).padStart(2, '0')
    const ss = String(date.getUTCSeconds()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}+00:00`
}

async function getGoogleAccessToken(): Promise<string> {
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET
    const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Google Ads OAuth credentials are missing')
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    })

    if (!response.ok) {
        const text = await response.text()
        throw new Error(`Failed to obtain Google OAuth token: ${response.status} ${text}`)
    }

    const data = await response.json() as { access_token?: string }
    if (!data.access_token) throw new Error('Google OAuth token response missing access_token')

    return data.access_token
}

export async function POST(req: Request) {
    const logger = createApiRequestLogger('ads/google-conversions')

    try {
        const secret = process.env.GOOGLE_ADS_WEBHOOK_SECRET
        if (secret) {
            const headerSecret = req.headers.get('x-ads-webhook-secret')
            if (headerSecret !== secret) return unauthorized(logger.requestId)
        }

        const parsed = googleAdsWebhookEventSchema.safeParse(await req.json())
        if (!parsed.success) {
            return jsonWithRequestId(
                logger.requestId,
                {
                    ok: false,
                    error: 'Invalid payload',
                    requestId: logger.requestId,
                    details: parsed.error.issues.map((issue) => ({
                        path: issue.path.join('.'),
                        message: issue.message,
                    })),
                },
                { status: 400 }
            )
        }

        const event: GoogleAdsWebhookEvent = parsed.data

        const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID
        const conversionActionId = process.env.GOOGLE_ADS_CONVERSION_ACTION_ID
        const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
        const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID

        if (!customerId || !conversionActionId || !developerToken) {
            return jsonWithRequestId(logger.requestId, { ok: true, skipped: true, reason: 'Google Ads env not configured' })
        }

        const hasClickId = !!(event.click_ids.gclid || event.click_ids.gbraid || event.click_ids.wbraid)
        if (!hasClickId) {
            return jsonWithRequestId(logger.requestId, { ok: true, skipped: true, reason: 'No Google click id in payload' })
        }

        const accessToken = await getGoogleAccessToken()

        const conversion = {
            conversionAction: `customers/${customerId}/conversionActions/${conversionActionId}`,
            conversionDateTime: formatGoogleDateTime(event.event_time),
            conversionValue: event.event_name === 'Lead' ? 1.0 : 0.0,
            currencyCode: 'BRL',
            orderId: event.event_id,
            gclid: event.click_ids.gclid,
            gbraid: event.click_ids.gbraid,
            wbraid: event.click_ids.wbraid,
        }

        const response = await fetch(`https://googleads.googleapis.com/v17/customers/${customerId}:uploadClickConversions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
                'developer-token': developerToken,
                ...(loginCustomerId ? { 'login-customer-id': loginCustomerId } : {}),
            },
            body: JSON.stringify({
                partialFailure: true,
                conversions: [conversion],
            }),
        })

        const resultText = await response.text()

        if (!response.ok) {
            logger.error('google_ads_api_failed', `status ${response.status}`)
            return jsonWithRequestId(
                logger.requestId,
                { ok: false, error: `Google Ads API error: ${response.status}`, details: resultText, requestId: logger.requestId },
                { status: 502 }
            )
        }

        logger.log('conversion_uploaded', { eventName: event.event_name })
        return jsonWithRequestId(logger.requestId, { ok: true, result: resultText })
    } catch (error) {
        logger.error('request_failed', error)
        return jsonWithRequestId(
            logger.requestId,
            { ok: false, error: 'Unknown error', requestId: logger.requestId },
            { status: 500 }
        )
    }
}

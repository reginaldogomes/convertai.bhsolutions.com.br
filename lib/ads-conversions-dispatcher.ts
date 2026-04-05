import { createHash } from 'crypto'
import type { AnalyticsEventType } from '@/types/database'

interface DispatchAdsConversionInput {
    landingPageId: string
    eventType: AnalyticsEventType
    visitorId?: string
    sessionId?: string
    metadata?: Record<string, unknown>
    requestHeaders?: Headers
}

interface MetaCapiEvent {
    event_name: string
    event_time: number
    event_id: string
    action_source: 'website'
    event_source_url?: string
    user_data: {
        client_ip_address?: string
        client_user_agent?: string
        external_id?: string[]
    }
    custom_data: Record<string, unknown>
}

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

function mapAnalyticsToAdsEvent(eventType: AnalyticsEventType): string {
    switch (eventType) {
        case 'view':
            return 'PageView'
        case 'chat_start':
            return 'Contact'
        case 'cta_click':
            return 'InitiateCheckout'
        case 'lead_captured':
            return 'Lead'
        default:
            return 'CustomEvent'
    }
}

function getClientIp(headers?: Headers): string | undefined {
    if (!headers) return undefined

    const forwarded = headers.get('x-forwarded-for')
    if (forwarded) {
        const first = forwarded.split(',')[0]?.trim()
        if (first) return first
    }

    return headers.get('x-real-ip') ?? undefined
}

function hashExternalId(value?: string): string | undefined {
    if (!value) return undefined
    return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

async function retry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
    let lastError: unknown
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error
            if (i < attempts - 1) {
                await new Promise((resolve) => setTimeout(resolve, 250 * (i + 1)))
            }
        }
    }
    throw lastError
}

async function sendMetaConversion(event: MetaCapiEvent): Promise<void> {
    const pixelId = process.env.META_PIXEL_ID
    const accessToken = process.env.META_ACCESS_TOKEN

    if (!pixelId || !accessToken) return

    const endpoint = `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`

    await retry(async () => {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: [event],
            }),
        })

        if (!response.ok) {
            const text = await response.text()
            throw new Error(`Meta CAPI failed: ${response.status} ${text}`)
        }
    })
}

async function sendGenericWebhook(event: MetaCapiEvent): Promise<void> {
    const webhookUrl = process.env.ADS_CONVERSION_WEBHOOK_URL
    if (!webhookUrl) return
    const webhookSecret = process.env.ADS_WEBHOOK_SECRET

    await retry(async () => {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(webhookSecret ? { 'x-ads-webhook-secret': webhookSecret } : {}),
            },
            body: JSON.stringify(event),
        })

        if (!response.ok) {
            const text = await response.text()
            throw new Error(`Ads webhook failed: ${response.status} ${text}`)
        }
    })
}

async function sendGoogleAdsWebhook(event: GoogleAdsWebhookEvent): Promise<void> {
    const webhookUrl = process.env.GOOGLE_ADS_CONVERSION_WEBHOOK_URL
    if (!webhookUrl) return
    const webhookSecret = process.env.GOOGLE_ADS_WEBHOOK_SECRET

    await retry(async () => {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(webhookSecret ? { 'x-ads-webhook-secret': webhookSecret } : {}),
            },
            body: JSON.stringify(event),
        })

        if (!response.ok) {
            const text = await response.text()
            throw new Error(`Google Ads webhook failed: ${response.status} ${text}`)
        }
    })
}

function hasMarketingConsent(metadata?: Record<string, unknown>): boolean {
    if (!metadata) return true
    if (typeof metadata.consentMarketing !== 'boolean') return true
    return metadata.consentMarketing
}

function getAttribution(metadata?: Record<string, unknown>): Record<string, unknown> {
    const attribution = metadata?.attribution
    return typeof attribution === 'object' && attribution !== null
        ? attribution as Record<string, unknown>
        : {}
}

export async function dispatchAdsConversion(input: DispatchAdsConversionInput): Promise<void> {
    if (!hasMarketingConsent(input.metadata)) return

    const eventIdFromMetadata = typeof input.metadata?.eventId === 'string'
        ? input.metadata.eventId
        : undefined

    const eventSourceUrlFromMetadata = typeof input.metadata?.pageUrl === 'string'
        ? input.metadata.pageUrl
        : undefined

    const attribution = getAttribution(input.metadata)

    const hashedExternalId = hashExternalId(input.visitorId)

    const event: MetaCapiEvent = {
        event_name: mapAnalyticsToAdsEvent(input.eventType),
        event_time: typeof input.metadata?.eventTime === 'number'
            ? input.metadata.eventTime
            : Math.floor(Date.now() / 1000),
        event_id: eventIdFromMetadata ?? crypto.randomUUID(),
        action_source: 'website',
        event_source_url: eventSourceUrlFromMetadata,
        user_data: {
            client_ip_address: getClientIp(input.requestHeaders),
            client_user_agent: input.requestHeaders?.get('user-agent') ?? undefined,
            external_id: hashedExternalId ? [hashedExternalId] : undefined,
        },
        custom_data: {
            landing_page_id: input.landingPageId,
            session_id: input.sessionId,
            analytics_event_type: input.eventType,
            attribution,
        },
    }

    const googleEvent: GoogleAdsWebhookEvent = {
        event_name: event.event_name,
        event_time: event.event_time,
        event_id: event.event_id,
        landing_page_id: input.landingPageId,
        session_id: input.sessionId,
        page_url: eventSourceUrlFromMetadata,
        attribution,
        click_ids: {
            gclid: typeof attribution.gclid === 'string' ? attribution.gclid : undefined,
            gbraid: typeof attribution.gbraid === 'string' ? attribution.gbraid : undefined,
            wbraid: typeof attribution.wbraid === 'string' ? attribution.wbraid : undefined,
            msclkid: typeof attribution.msclkid === 'string' ? attribution.msclkid : undefined,
        },
        user: {
            external_id_hash: hashedExternalId,
            client_ip_address: event.user_data.client_ip_address,
            client_user_agent: event.user_data.client_user_agent,
        },
    }

    // Keep failures visible so outbox retries can run.
    const results = await Promise.allSettled([
        sendMetaConversion(event),
        sendGoogleAdsWebhook(googleEvent),
        sendGenericWebhook(event),
    ])

    const errors = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((result) => result.reason instanceof Error ? result.reason.message : String(result.reason))

    if (errors.length > 0) {
        throw new Error(`Ads conversion dispatch failed: ${errors.join(' | ')}`)
    }
}

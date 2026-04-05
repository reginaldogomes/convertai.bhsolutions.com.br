export interface AdsAttributionData {
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string
    utmTerm?: string
    utmContent?: string
    gclid?: string
    gbraid?: string
    wbraid?: string
    fbclid?: string
    ttclid?: string
    msclkid?: string
    referrer?: string
    landingUrl?: string
    capturedAt?: string
}

const STORAGE_KEY = 'ag_ads_attribution'
const CONSENT_STORAGE_KEY = 'ag_marketing_consent'

function isBrowser(): boolean {
    return typeof window !== 'undefined'
}

function readParams(): URLSearchParams {
    if (!isBrowser()) return new URLSearchParams()
    return new URLSearchParams(window.location.search)
}

export function getStoredAttribution(): AdsAttributionData {
    if (!isBrowser()) return {}

    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    try {
        const parsed = JSON.parse(raw) as AdsAttributionData
        return parsed ?? {}
    } catch {
        return {}
    }
}

export function captureAttributionFromCurrentPage(): AdsAttributionData {
    if (!isBrowser()) return {}

    const params = readParams()
    const existing = getStoredAttribution()

    const incoming: AdsAttributionData = {
        utmSource: params.get('utm_source') ?? undefined,
        utmMedium: params.get('utm_medium') ?? undefined,
        utmCampaign: params.get('utm_campaign') ?? undefined,
        utmTerm: params.get('utm_term') ?? undefined,
        utmContent: params.get('utm_content') ?? undefined,
        gclid: params.get('gclid') ?? undefined,
        gbraid: params.get('gbraid') ?? undefined,
        wbraid: params.get('wbraid') ?? undefined,
        fbclid: params.get('fbclid') ?? undefined,
        ttclid: params.get('ttclid') ?? undefined,
        msclkid: params.get('msclkid') ?? undefined,
    }

    const hasIncoming = Object.values(incoming).some(Boolean)

    const merged: AdsAttributionData = {
        ...existing,
        ...(hasIncoming ? incoming : {}),
        referrer: document.referrer || existing.referrer,
        landingUrl: window.location.href,
        capturedAt: hasIncoming ? new Date().toISOString() : existing.capturedAt,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    return merged
}

export function buildAdsMetadata(eventType: string): Record<string, unknown> {
    const attribution = getStoredAttribution()
    const consentMarketing = getMarketingConsent()

    return {
        eventType,
        eventId: crypto.randomUUID(),
        eventTime: Math.floor(Date.now() / 1000),
        consentMarketing,
        attribution,
        pageUrl: isBrowser() ? window.location.href : undefined,
    }
}

export function getMarketingConsent(): boolean {
    if (!isBrowser()) return true

    const raw = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (raw === null) return true
    return raw === 'true'
}

export function hasStoredMarketingConsent(): boolean {
    if (!isBrowser()) return false
    return localStorage.getItem(CONSENT_STORAGE_KEY) !== null
}

export function setMarketingConsent(consent: boolean): void {
    if (!isBrowser()) return
    localStorage.setItem(CONSENT_STORAGE_KEY, consent ? 'true' : 'false')
}

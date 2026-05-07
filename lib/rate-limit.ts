interface RateLimitOptions {
    intervalMs: number
    maxRequests: number
    maxKeys?: number
}

interface RateLimitEntry {
    count: number
    resetAt: number
}

interface RateLimitResult {
    allowed: boolean
    remaining: number
    resetAt: number
    retryAfterSeconds: number
}

const DEFAULT_MAX_KEYS = 5000
const buckets = new Map<string, RateLimitEntry>()

function pruneExpired(now: number) {
    for (const [key, entry] of buckets) {
        if (entry.resetAt <= now) buckets.delete(key)
    }
}

function enforceMaxKeys(maxKeys: number) {
    if (buckets.size <= maxKeys) return

    const overflow = buckets.size - maxKeys
    let removed = 0
    for (const key of buckets.keys()) {
        buckets.delete(key)
        removed += 1
        if (removed >= overflow) return
    }
}

export function getClientIp(headers: Headers): string {
    const forwardedFor = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    const realIp = headers.get('x-real-ip')?.trim()
    const cfConnectingIp = headers.get('cf-connecting-ip')?.trim()

    return forwardedFor || realIp || cfConnectingIp || 'unknown'
}

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
    const now = Date.now()
    const maxKeys = options.maxKeys ?? DEFAULT_MAX_KEYS

    pruneExpired(now)
    enforceMaxKeys(maxKeys)

    const existing = buckets.get(key)
    const entry = existing && existing.resetAt > now
        ? existing
        : { count: 0, resetAt: now + options.intervalMs }

    entry.count += 1
    buckets.set(key, entry)

    const remaining = Math.max(options.maxRequests - entry.count, 0)
    const retryAfterSeconds = Math.max(Math.ceil((entry.resetAt - now) / 1000), 1)

    return {
        allowed: entry.count <= options.maxRequests,
        remaining,
        resetAt: entry.resetAt,
        retryAfterSeconds,
    }
}

export function rateLimitHeaders(result: RateLimitResult, limit: number): HeadersInit {
    return {
        'x-ratelimit-limit': String(limit),
        'x-ratelimit-remaining': String(result.remaining),
        'x-ratelimit-reset': String(Math.ceil(result.resetAt / 1000)),
        ...(result.allowed ? {} : { 'retry-after': String(result.retryAfterSeconds) }),
    }
}

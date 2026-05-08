export function asRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

export function asString(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

export function asNullableString(value: unknown, fallback: string | null): string | null {
    if (value === null) return null
    if (typeof value === 'string') return value
    return fallback
}

export function asBoolean(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback
}

export function normalizeColumns(value: unknown): 2 | 3 | 4 {
    const num = Number(value)
    if (num === 2 || num === 3 || num === 4) return num
    return 3
}

export function normalizeRating(value: unknown): number {
    const num = Number(value)
    if (Number.isNaN(num)) return 5
    return Math.max(1, Math.min(5, Math.round(num)))
}

export function escapeXml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;')
}

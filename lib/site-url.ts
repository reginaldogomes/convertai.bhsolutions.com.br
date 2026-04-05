const LOCAL_URL = 'http://localhost:3000'

export function getSiteUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || LOCAL_URL
    return baseUrl.replace(/\/+$/, '')
}

export function toAbsoluteUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${getSiteUrl()}${normalizedPath}`
}

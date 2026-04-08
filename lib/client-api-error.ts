export interface ParsedApiError {
    message: string
    requestId: string | null
    status: number
}

function readRequestId(headers: Headers): string | null {
    return headers.get('x-request-id') || headers.get('x-chat-request-id') || null
}

export function formatErrorWithRequestId(message: string, requestId: string | null): string {
    if (!requestId) return message
    return `${message} Ref: ${requestId}`
}

export async function parseApiError(response: Response, fallbackMessage: string): Promise<ParsedApiError> {
    const requestIdFromHeader = readRequestId(response.headers)

    try {
        const data = await response.json() as { error?: string; requestId?: string }
        const requestId = requestIdFromHeader || data.requestId || null
        const message = typeof data.error === 'string' && data.error.trim().length > 0
            ? data.error
            : fallbackMessage

        return {
            message,
            requestId,
            status: response.status,
        }
    } catch {
        return {
            message: fallbackMessage,
            requestId: requestIdFromHeader,
            status: response.status,
        }
    }
}

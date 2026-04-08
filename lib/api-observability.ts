import { NextResponse } from 'next/server'
import { NotAuthenticatedError, OrganizationNotFoundError } from '@/domain/errors'

type ApiLogPayload = Record<string, unknown>

function buildErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    return 'Unknown error'
}

export function isAuthError(error: unknown): boolean {
    return error instanceof NotAuthenticatedError || error instanceof OrganizationNotFoundError
}

export function createApiRequestLogger(scope: string) {
    const requestId = crypto.randomUUID()
    const startedAt = Date.now()

    function basePayload(payload?: ApiLogPayload): ApiLogPayload {
        return {
            requestId,
            elapsedMs: Date.now() - startedAt,
            ...(payload ?? {}),
        }
    }

    return {
        requestId,
        log(event: string, payload?: ApiLogPayload) {
            console.info(`[api:${scope}] ${event}`, basePayload(payload))
        },
        error(event: string, error: unknown, payload?: ApiLogPayload) {
            console.error(`[api:${scope}] ${event}`, {
                ...basePayload(payload),
                error: buildErrorMessage(error),
            })
        },
    }
}

export function jsonWithRequestId<T>(requestId: string, body: T, init?: ResponseInit): NextResponse<T> {
    const response = NextResponse.json(body, init)
    response.headers.set('x-request-id', requestId)
    return response
}

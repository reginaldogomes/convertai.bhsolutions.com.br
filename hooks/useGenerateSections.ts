import { useCallback, useReducer, useRef } from 'react'
import type { DesignSystem } from '@/domain/value-objects/design-system'
import { formatErrorWithRequestId, parseApiError } from '@/lib/client-api-error'

const GENERATION_CACHE_TTL_MS = 10 * 60 * 1000
const GENERATION_CACHE_MAX_ENTRIES = 20

type GenerationStatus = 'idle' | 'generating' | 'success' | 'error'

interface GeneratedSection {
    type: string
    content: Record<string, unknown>
}

interface GenerationState {
    status: GenerationStatus
    error: string
    sections: GeneratedSection[]
    sectionsJson: string
    sectionsCount: number
    generatedDesignSystemJson: string
    generatedDesignSystem: DesignSystem | null
    requestId: number
}

type GenerationAction =
    | { type: 'RESET' }
    | { type: 'START'; requestId: number }
    | {
        type: 'SUCCESS'
        requestId: number
        sections: GeneratedSection[]
        generatedDesignSystem: DesignSystem | null
    }
    | { type: 'ERROR'; requestId: number; error: string }

interface GenerateSectionsParams {
    prompt: string
    pageContext?: { name?: string; headline?: string; subheadline?: string }
    productContext?: string
    productId?: string
    imageGeneration?: {
        enabled?: boolean
        model?: 'gemini-2.5-flash-image' | 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview'
    }
}

interface GenerateSectionsResult {
    sections: GeneratedSection[]
    generatedDesignSystem: DesignSystem | null
}

interface CachedGeneration {
    timestamp: number
    sections: GeneratedSection[]
    generatedDesignSystem: DesignSystem | null
}

const initialState: GenerationState = {
    status: 'idle',
    error: '',
    sections: [],
    sectionsJson: '',
    sectionsCount: 0,
    generatedDesignSystemJson: '',
    generatedDesignSystem: null,
    requestId: 0,
}

function reducer(state: GenerationState, action: GenerationAction): GenerationState {
    switch (action.type) {
        case 'RESET':
            return initialState
        case 'START':
            return {
                ...state,
                status: 'generating',
                error: '',
                sections: [],
                sectionsJson: '',
                sectionsCount: 0,
                generatedDesignSystem: null,
                generatedDesignSystemJson: '',
                requestId: action.requestId,
            }
        case 'SUCCESS':
            return {
                ...state,
                status: 'success',
                error: '',
                sections: action.sections,
                sectionsJson: JSON.stringify(action.sections),
                sectionsCount: action.sections.length,
                generatedDesignSystem: action.generatedDesignSystem,
                generatedDesignSystemJson: action.generatedDesignSystem ? JSON.stringify(action.generatedDesignSystem) : '',
                requestId: action.requestId,
            }
        case 'ERROR':
            return {
                ...state,
                status: 'error',
                error: action.error,
                sections: [],
                sectionsJson: '',
                sectionsCount: 0,
                generatedDesignSystem: null,
                generatedDesignSystemJson: '',
                requestId: action.requestId,
            }
        default:
            return state
    }
}

export function useGenerateSections() {
    const [state, dispatch] = useReducer(reducer, initialState)
    const abortRef = useRef<AbortController | null>(null)
    const requestIdRef = useRef(0)
    const inFlightKeyRef = useRef<string | null>(null)
    const cacheRef = useRef<Map<string, CachedGeneration>>(new Map())

    const reset = useCallback(() => {
        abortRef.current?.abort()
        abortRef.current = null
        inFlightKeyRef.current = null
        dispatch({ type: 'RESET' })
    }, [])

    const generateSections = useCallback(async (params: GenerateSectionsParams): Promise<GenerateSectionsResult | null> => {
        const prompt = params.prompt.trim()
        if (prompt.length < 10) {
            dispatch({
                type: 'ERROR',
                requestId: requestIdRef.current,
                error: 'Descreva o negócio com pelo menos 10 caracteres.',
            })
            return null
        }

        const payload = {
            prompt,
            pageContext: params.pageContext,
            productContext: params.productContext,
            productId: params.productId,
            imageGeneration: params.imageGeneration,
        }
        const requestKey = JSON.stringify(payload)
        const now = Date.now()
        const cached = cacheRef.current.get(requestKey)

        if (cached && now - cached.timestamp < GENERATION_CACHE_TTL_MS) {
            const requestId = requestIdRef.current + 1
            requestIdRef.current = requestId
            dispatch({
                type: 'SUCCESS',
                requestId,
                sections: cached.sections,
                generatedDesignSystem: cached.generatedDesignSystem,
            })
            return {
                sections: cached.sections,
                generatedDesignSystem: cached.generatedDesignSystem,
            }
        }

        if (inFlightKeyRef.current === requestKey) {
            return null
        }

        abortRef.current?.abort()

        const controller = new AbortController()
        abortRef.current = controller
        inFlightKeyRef.current = requestKey
        const requestId = requestIdRef.current + 1
        requestIdRef.current = requestId

        dispatch({ type: 'START', requestId })

        try {
            const response = await fetch('/api/landing-pages/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal,
            })
            if (requestId !== requestIdRef.current) return null

            if (!response.ok) {
                const apiError = await parseApiError(response, `Erro ${response.status}`)
                throw new Error(formatErrorWithRequestId(apiError.message, apiError.requestId))
            }

            const data = await response.json()

            if (!Array.isArray(data.sections) || data.sections.length === 0) {
                throw new Error('A IA não retornou seções válidas. Tente descrever com mais detalhes.')
            }

            const cacheSnapshot: CachedGeneration = {
                timestamp: now,
                sections: data.sections as GeneratedSection[],
                generatedDesignSystem: (data.designSystem ?? null) as DesignSystem | null,
            }
            cacheRef.current.set(requestKey, cacheSnapshot)
            if (cacheRef.current.size > GENERATION_CACHE_MAX_ENTRIES) {
                const oldestKey = cacheRef.current.keys().next().value
                if (oldestKey) cacheRef.current.delete(oldestKey)
            }

            dispatch({
                type: 'SUCCESS',
                requestId,
                sections: cacheSnapshot.sections,
                generatedDesignSystem: cacheSnapshot.generatedDesignSystem,
            })

            return {
                sections: cacheSnapshot.sections,
                generatedDesignSystem: cacheSnapshot.generatedDesignSystem,
            }
        } catch (error) {
            if (controller.signal.aborted || requestId !== requestIdRef.current) return null
            dispatch({
                type: 'ERROR',
                requestId,
                error: error instanceof Error ? error.message : 'Erro ao gerar conteúdo com IA',
            })
            return null
        } finally {
            if (inFlightKeyRef.current === requestKey) {
                inFlightKeyRef.current = null
            }
        }
    }, [])

    return {
        state,
        reset,
        generateSections,
        isGenerating: state.status === 'generating',
        hasValidSections: state.sectionsCount > 0,
    }
}

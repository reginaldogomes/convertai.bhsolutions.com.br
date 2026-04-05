import { useCallback, useReducer, useRef } from 'react'
import type { DesignSystem } from '@/domain/value-objects/design-system'

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

    const reset = useCallback(() => {
        abortRef.current?.abort()
        abortRef.current = null
        dispatch({ type: 'RESET' })
    }, [])

    const generateSections = useCallback(async (params: GenerateSectionsParams) => {
        const prompt = params.prompt.trim()
        if (prompt.length < 10) {
            dispatch({
                type: 'ERROR',
                requestId: requestIdRef.current,
                error: 'Descreva o negócio com pelo menos 10 caracteres.',
            })
            return
        }

        abortRef.current?.abort()

        const controller = new AbortController()
        abortRef.current = controller
        const requestId = requestIdRef.current + 1
        requestIdRef.current = requestId

        dispatch({ type: 'START', requestId })

        try {
            const response = await fetch('/api/landing-pages/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    pageContext: params.pageContext,
                    productContext: params.productContext,
                    productId: params.productId,
                }),
                signal: controller.signal,
            })

            const data = await response.json()
            if (requestId !== requestIdRef.current) return

            if (!response.ok) {
                throw new Error(data.error || `Erro ${response.status}`)
            }

            if (!Array.isArray(data.sections) || data.sections.length === 0) {
                throw new Error('A IA não retornou seções válidas. Tente descrever com mais detalhes.')
            }

            dispatch({
                type: 'SUCCESS',
                requestId,
                sections: data.sections as GeneratedSection[],
                generatedDesignSystem: (data.designSystem ?? null) as DesignSystem | null,
            })
        } catch (error) {
            if (controller.signal.aborted || requestId !== requestIdRef.current) return
            dispatch({
                type: 'ERROR',
                requestId,
                error: error instanceof Error ? error.message : 'Erro ao gerar conteúdo com IA',
            })
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

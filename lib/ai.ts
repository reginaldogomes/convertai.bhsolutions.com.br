import { createGoogleGenerativeAI } from '@ai-sdk/google'

const googleProvider = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY,
})

/**
 * Em desenvolvimento (DEV_MOCK_INTEGRATIONS=true), limita a saída dos modelos
 * a 512 tokens para reduzir custos da API Gemini.
 * Em produção, usa undefined (sem limite explícito, cada rota define o seu).
 */
export const DEV_AI_MAX_TOKENS: number | undefined =
    process.env.DEV_MOCK_INTEGRATIONS === 'true' ? 512 : undefined

// Default text models now use Gemini to avoid OpenAI key dependency.
export const agentModel = googleProvider('gemini-2.5-flash')
export const powerModel = googleProvider('gemini-2.5-pro')

// Structured output models
export const structuredOutputModel = googleProvider('gemini-2.5-flash')
export const structuredPowerModel = googleProvider('gemini-2.5-pro')

// Gemini — Used for campaign HTML generation
export const geminiModel = googleProvider('gemini-2.5-flash')

// Gemini Image Generation Models (Nano Banana family)
export const IMAGE_MODELS = [
    {
        id: 'gemini-2.5-flash-image',
        name: 'Nano Banana',
        description: 'Rápido e eficiente — geração em 1024px, ideal para alto volume',
        badge: 'Flash',
        supportsSize: false,
        maxResolution: '1K',
    },
    {
        id: 'gemini-3.1-flash-image-preview',
        name: 'Nano Banana 2',
        description: 'Alta eficiência com até 4K, otimizado para velocidade',
        badge: 'Novo',
        supportsSize: true,
        maxResolution: '4K',
    },
    {
        id: 'gemini-3-pro-image-preview',
        name: 'Nano Banana Pro',
        description: 'Produção profissional — 4K, raciocínio avançado, texto preciso',
        badge: 'Pro',
        supportsSize: true,
        maxResolution: '4K',
    },
] as const

export type ImageModelId = (typeof IMAGE_MODELS)[number]['id']

import { google } from '@ai-sdk/google'

// Default text models now use Gemini to avoid OpenAI key dependency.
export const agentModel = google('gemini-2.5-flash')
export const powerModel = google('gemini-2.5-pro')

// Gemini — Used for campaign HTML generation
export const geminiModel = google('gemini-2.5-flash')

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

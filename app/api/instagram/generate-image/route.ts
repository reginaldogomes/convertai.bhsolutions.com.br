import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! })

const VALID_MODELS = new Set([
    'gemini-2.5-flash-image',
    'gemini-3-pro-image-preview',
    'gemini-3.1-flash-image-preview',
])

const VALID_ASPECTS = new Set([
    '1:1', '9:16', '16:9', '4:5', '5:4', '3:4', '4:3', '2:3', '3:2',
])

const VALID_SIZES = new Set(['512', '1K', '2K', '4K'])

// Models that support imageSize configuration
const SUPPORTS_IMAGE_SIZE = new Set([
    'gemini-3-pro-image-preview',
    'gemini-3.1-flash-image-preview',
])

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { model, prompt, aspectRatio, imageSize } = body

        if (!model || !VALID_MODELS.has(model)) {
            return NextResponse.json({ error: 'Modelo inválido' }, { status: 400 })
        }

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0 || prompt.length > 4000) {
            return NextResponse.json({ error: 'Prompt inválido (máx. 4000 caracteres)' }, { status: 400 })
        }

        const imageConfig: Record<string, string> = {}

        if (aspectRatio && VALID_ASPECTS.has(aspectRatio)) {
            imageConfig.aspectRatio = aspectRatio
        }

        if (imageSize && VALID_SIZES.has(imageSize) && SUPPORTS_IMAGE_SIZE.has(model)) {
            imageConfig.imageSize = imageSize
        }

        const response = await genai.models.generateContent({
            model,
            contents: prompt.trim(),
            config: {
                responseModalities: ['IMAGE'],
                ...(Object.keys(imageConfig).length > 0 ? { imageConfig } : {}),
            },
        })

        const images: Array<{ data: string; mimeType: string }> = []
        const candidate = response.candidates?.[0]

        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    images.push({
                        data: part.inlineData.data!,
                        mimeType: part.inlineData.mimeType!,
                    })
                }
            }
        }

        if (images.length === 0) {
            return NextResponse.json(
                { error: 'Nenhuma imagem gerada. O modelo pode ter bloqueado o conteúdo. Tente um prompt diferente.' },
                { status: 422 },
            )
        }

        return NextResponse.json({ images })
    } catch (error) {
        console.error('[generate-image] Error:', error)
        const message = error instanceof Error ? error.message : 'Erro ao gerar imagem'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

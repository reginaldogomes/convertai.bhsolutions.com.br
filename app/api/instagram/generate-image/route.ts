import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createApiRequestLogger, jsonWithRequestId } from '@/lib/api-observability'
import { z } from 'zod'

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

const imageGenerationSchema = z.object({
    model: z.enum([
        'gemini-2.5-flash-image',
        'gemini-3-pro-image-preview',
        'gemini-3.1-flash-image-preview',
    ]),
    prompt: z.string().trim().min(1).max(4000),
    aspectRatio: z
        .enum(['1:1', '9:16', '16:9', '4:5', '5:4', '3:4', '4:3', '2:3', '3:2'])
        .optional(),
    imageSize: z.enum(['512', '1K', '2K', '4K']).optional(),
})

export async function POST(request: Request) {
    const logger = createApiRequestLogger('instagram/generate-image')

    try {
        const parsed = imageGenerationSchema.safeParse(await request.json())
        if (!parsed.success) {
            return jsonWithRequestId(
                logger.requestId,
                {
                    error: 'Payload inválido para geração de imagem',
                    requestId: logger.requestId,
                    details: parsed.error.issues.map((issue) => ({
                        path: issue.path.join('.'),
                        message: issue.message,
                    })),
                },
                { status: 400 }
            )
        }

        const { model, prompt, aspectRatio, imageSize } = parsed.data

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
            return jsonWithRequestId(
                logger.requestId,
                {
                    error: 'Nenhuma imagem gerada. O modelo pode ter bloqueado o conteúdo. Tente um prompt diferente.',
                    requestId: logger.requestId,
                },
                { status: 422 },
            )
        }

        logger.log('images_generated', {
            model,
            imagesCount: images.length,
            hasAspectRatio: Boolean(imageConfig.aspectRatio),
            hasImageSize: Boolean(imageConfig.imageSize),
        })

        return jsonWithRequestId(logger.requestId, { images })
    } catch (error) {
        logger.error('generation_failed', error)
        return jsonWithRequestId(
            logger.requestId,
            { error: 'Erro ao gerar imagem', requestId: logger.requestId },
            { status: 500 }
        )
    }
}

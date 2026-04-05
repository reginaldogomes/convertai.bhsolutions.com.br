import { GoogleGenAI } from '@google/genai'

export type NanoBananaModelId =
    | 'gemini-2.5-flash-image'
    | 'gemini-3.1-flash-image-preview'
    | 'gemini-3-pro-image-preview'

interface GenerateNanoBananaImageInput {
    prompt: string
    model?: NanoBananaModelId
    aspectRatio?: '1:1' | '4:3' | '3:4' | '16:9' | '9:16'
}

const DEFAULT_MODEL: NanoBananaModelId = 'gemini-2.5-flash-image'

function getClient(): GoogleGenAI | null {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) return null
    return new GoogleGenAI({ apiKey })
}

export async function generateNanoBananaImageDataUrl(input: GenerateNanoBananaImageInput): Promise<string | null> {
    const client = getClient()
    if (!client) return null

    const prompt = input.prompt.trim()
    if (prompt.length < 10) return null

    try {
        const response = await client.models.generateContent({
            model: input.model ?? DEFAULT_MODEL,
            contents: prompt,
            config: {
                responseModalities: ['IMAGE'],
                imageConfig: {
                    aspectRatio: input.aspectRatio ?? '16:9',
                },
            },
        })

        const parts = response.candidates?.[0]?.content?.parts ?? []
        const imagePart = parts.find((part) => !!part.inlineData?.data)

        if (!imagePart?.inlineData?.data || !imagePart.inlineData.mimeType) {
            return null
        }

        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
    } catch {
        return null
    }
}

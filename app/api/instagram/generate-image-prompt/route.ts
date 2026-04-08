import { streamText } from 'ai'
import { powerModel } from '@/lib/ai'
import { getAuthContext } from '@/infrastructure/auth'
import { z } from 'zod'
import { createApiRequestLogger, isAuthError } from '@/lib/api-observability'
import { enforceAiUsagePolicy, recordAiUsageEvent } from '@/lib/ai-governance'

const generateImagePromptSchema = z.object({
    topic: z.string().min(3).max(500),
    contentType: z.string().min(1).max(60),
    style: z.string().max(500).optional().default(''),
    targetAudience: z.string().max(500).optional().default(''),
})

export async function POST(request: Request) {
    const logger = createApiRequestLogger('instagram/generate-image-prompt')
    let usageContext: { organizationId: string; userId: string; requestId: string; routeScope: string; featureKey: string; model: string; provider: 'google' } | null = null

    try {
        const { orgId, userId } = await getAuthContext()
        const parsed = generateImagePromptSchema.safeParse(await request.json())

        if (!parsed.success) {
            return Response.json(
                {
                    error: 'Payload inválido para geração de prompt de imagem',
                    requestId: logger.requestId,
                    details: parsed.error.issues.map((issue) => ({
                        path: issue.path.join('.'),
                        message: issue.message,
                    })),
                },
                {
                    status: 400,
                    headers: { 'x-request-id': logger.requestId },
                }
            )
        }

        const { topic, contentType, style, targetAudience } = parsed.data

        usageContext = {
            organizationId: orgId,
            userId,
            requestId: logger.requestId,
            routeScope: 'instagram/generate-image-prompt',
            featureKey: 'instagram_image_prompt_generation',
            model: 'gemini-2.5-pro',
            provider: 'google',
        }

        const inputChars = `${topic}${contentType}${style}${targetAudience}`.length
        const guard = await enforceAiUsagePolicy(usageContext)
        if (!guard.allowed) {
            await recordAiUsageEvent(usageContext, {
                status: 'blocked',
                inputChars,
                errorCode: guard.status === 429 ? 'daily_limit_reached' : 'monthly_budget_reached',
            })

            return Response.json(
                {
                    error: guard.error,
                    requestId: logger.requestId,
                    limits: {
                        dailyRequestsLimit: guard.policy.dailyRequestsLimit,
                        monthlyBudgetCents: guard.policy.monthlyBudgetCents,
                    },
                },
                {
                    status: guard.status,
                    headers: { 'x-request-id': logger.requestId },
                }
            )
        }

        const result = streamText({
            model: powerModel,
            system: `Você é um especialista em criação de conteúdo visual para Instagram e direção de arte.
Sua tarefa é gerar prompts detalhados para geração de imagens com IA (como DALL-E, Midjourney ou Gemini).

## Regras:
1. Gere prompts em INGLÊS (melhor resultado com modelos de imagem).
2. Seja extremamente descritivo: cores, composição, iluminação, estilo artístico.
3. Inclua aspect ratio adequado ao formato (1:1 para post, 9:16 para story/reel, 1:1 para carrossel).
4. Evite texto nas imagens (difícil de gerar com qualidade).
5. Para carrosseis, gere um prompt para cada slide (separe com ---SLIDE---).
6. Mantenha consistência visual entre slides do carrossel.
7. Inclua sugestões de paleta de cores.`,
        prompt: `Crie prompts de geração de imagem para o seguinte conteúdo de Instagram:

**Tipo**: ${contentType}
**Tema**: ${topic}
**Estilo visual**: ${style || 'Moderno e limpo'}
**Público-alvo**: ${targetAudience || 'Geral'}

Gere prompts detalhados e prontos para usar em ferramentas de geração de imagem por IA.`,
        })

        logger.log('generation_started', { contentType })

        await recordAiUsageEvent(usageContext, {
            status: 'started',
            inputChars,
            metadata: {
                contentType,
            },
        })

        return result.toTextStreamResponse({
            headers: {
                'x-request-id': logger.requestId,
            },
        })
    } catch (error) {
        logger.error('generation_failed', error)

        if (usageContext) {
            await recordAiUsageEvent(usageContext, {
                status: 'error',
                errorCode: 'generation_failed',
            })
        }

        if (isAuthError(error)) {
            return Response.json({ error: 'Não autenticado', requestId: logger.requestId }, { status: 401, headers: { 'x-request-id': logger.requestId } })
        }

        return Response.json({ error: 'Erro ao gerar prompt de imagem', requestId: logger.requestId }, { status: 500, headers: { 'x-request-id': logger.requestId } })
    }
}

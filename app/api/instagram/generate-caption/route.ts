import { streamText } from 'ai'
import { geminiModel } from '@/lib/ai'
import { getAuthContext } from '@/infrastructure/auth'
import { enforceAiUsagePolicy, recordAiUsageEvent } from '@/lib/ai-governance'
import { z } from 'zod'
import { createApiRequestLogger, isAuthError } from '@/lib/api-observability'

    let usageContext: { organizationId: string; userId: string; requestId: string; routeScope: string; featureKey: string; model: string; provider: 'google' } | null = null
const CONTENT_TYPES: Record<string, string> = {
    post: 'Post para feed do Instagram (imagem estática com legenda)',
        const { orgId, userId } = await getAuthContext()
    reel: 'Reel do Instagram (vídeo curto vertical, até 90 segundos)',
    carousel: 'Carrossel do Instagram (múltiplas imagens/slides com legenda)',
}

const OBJECTIVES: Record<string, string> = {
    engajamento: 'Gerar engajamento (likes, comentários, saves, shares)',
    trafego: 'Direcionar tráfego para site/link',
    vendas: 'Promover produto ou serviço para vendas diretas',
    autoridade: 'Construir autoridade e posicionamento de marca',
    educacional: 'Conteúdo educacional e informativo',
    entretenimento: 'Conteúdo de entretenimento e viralização',
}

const TONES: Record<string, string> = {
    profissional: 'Tom profissional e corporativo',
    casual: 'Tom casual e descontraído',
    inspirador: 'Tom inspirador e motivacional',
    humoristico: 'Tom humorístico e leve',
    urgente: 'Tom de urgência e escassez',
}

const generateCaptionSchema = z.object({
    contentType: z.string().min(1),
    objective: z.string().min(1),
    tone: z.string().min(1),
    topic: z.string().min(3).max(500),
    details: z.string().max(4000).optional().default(''),
    targetAudience: z.string().max(500).optional().default(''),
    includeHashtags: z.boolean().default(true),
    includeEmojis: z.boolean().default(true),
})

export async function POST(request: Request) {

        usageContext = {
            organizationId: orgId,
            userId,
            requestId: logger.requestId,
            routeScope: 'instagram/generate-caption',
            featureKey: 'instagram_caption_generation',
            model: 'gemini-2.5-flash',
            provider: 'google',
        }

        const inputChars = `${topic}${details}${targetAudience}`.length
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
    const logger = createApiRequestLogger('instagram/generate-caption')

    try {
        await getAuthContext()
        const parsed = generateCaptionSchema.safeParse(await request.json())

        if (!parsed.success) {
            return Response.json(
                {
                    error: 'Payload inválido para geração de legenda',
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

        const {
            contentType,
            objective,
            tone,
            topic,
            details,
            targetAudience,
            includeHashtags,
            includeEmojis,
        } = parsed.data


        await recordAiUsageEvent(usageContext, {
            status: 'started',
            inputChars,
            metadata: {
                contentType,
                objective,
                tone,
                includeHashtags,
                includeEmojis,
            },
        })
        const typeDesc = CONTENT_TYPES[contentType] ?? contentType
        const objectiveDesc = OBJECTIVES[objective] ?? objective
        const toneDesc = TONES[tone] ?? tone

        const result = streamText({
            model: geminiModel,
            system: `Você é um especialista em marketing digital e criação de conteúdo para Instagram.
Sua tarefa é gerar conteúdo otimizado para Instagram que maximiza engajamento e alcance.

        if (usageContext) {
            await recordAiUsageEvent(usageContext, {
                status: 'error',
                errorCode: 'generation_failed',
            })
        }


## Regras:
1. Gere APENAS o texto da legenda (caption). Não inclua descrição de imagem.
2. Use português brasileiro natural e fluente.
3. Respeite o limite de 2200 caracteres do Instagram.
4. Estruture o texto com hooks fortes na primeira linha (antes do "ver mais").
5. Use quebras de linha estratégicas para facilitar a leitura.
6. ${includeEmojis ? 'Use emojis de forma estratégica para destacar pontos importantes.' : 'NÃO use emojis.'}
7. ${includeHashtags ? 'Inclua 15-20 hashtags relevantes ao final, separadas por espaço. Mix de hashtags populares e nichadas.' : 'NÃO inclua hashtags.'}
8. Inclua um CTA (call-to-action) claro e direto.
9. Para carrosseis, separe o conteúdo de cada slide com "---SLIDE---".
10. Para reels, inclua sugestão de roteiro com timestamps.
11. Para stories, sugira elementos interativos (enquete, quiz, perguntas).

## Formato de resposta:
Retorne APENAS o texto da legenda pronto para copiar e colar.`,
            prompt: `Crie uma legenda para Instagram com as seguintes especificações:

**Tipo de conteúdo**: ${typeDesc}
**Objetivo**: ${objectiveDesc}
**Tom**: ${toneDesc}
**Tema/Assunto**: ${topic}
**Público-alvo**: ${targetAudience || 'Geral'}
${details ? `**Detalhes adicionais**: ${details}` : ''}

Gere o conteúdo otimizado para máximo engajamento e alcance orgânico.`,
        })

        logger.log('generation_started', { contentType, objective, tone })

        return result.toTextStreamResponse({
            headers: {
                'x-request-id': logger.requestId,
            },
        })
    } catch (error) {
        logger.error('generation_failed', error)
        if (isAuthError(error)) {
            return Response.json({ error: 'Não autenticado', requestId: logger.requestId }, { status: 401, headers: { 'x-request-id': logger.requestId } })
        }

        return Response.json({ error: 'Erro ao gerar legenda', requestId: logger.requestId }, { status: 500, headers: { 'x-request-id': logger.requestId } })
    }
}

import { streamText } from 'ai'
import { powerModel } from '@/lib/ai'
import { getAuthContext } from '@/infrastructure/auth'
import { z } from 'zod'
import { createApiRequestLogger, isAuthError } from '@/lib/api-observability'
import { enforceAiUsagePolicy, recordAiUsageEvent } from '@/lib/ai-governance'

const generateCalendarSchema = z.object({
    niche: z.string().min(2).max(300),
    days: z.number().int().min(1).max(31),
    contentTypes: z.array(z.string().min(1)).min(1).max(10),
    objectives: z.array(z.string().min(1)).min(1).max(10),
})

export async function POST(request: Request) {
    const logger = createApiRequestLogger('instagram/generate-calendar')
    let usageContext: { organizationId: string; userId: string; requestId: string; routeScope: string; featureKey: string; model: string; provider: 'google' } | null = null

    try {
        const { orgId, userId } = await getAuthContext()
        const parsed = generateCalendarSchema.safeParse(await request.json())

        if (!parsed.success) {
            return Response.json(
                {
                    error: 'Payload inválido para geração de calendário',
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

        const { niche, days, contentTypes, objectives } = parsed.data

        usageContext = {
            organizationId: orgId,
            userId,
            requestId: logger.requestId,
            routeScope: 'instagram/generate-calendar',
            featureKey: 'instagram_calendar_generation',
            model: 'gemini-2.5-pro',
            provider: 'google',
        }

        const inputChars = `${niche}${contentTypes.join(',')}${objectives.join(',')}${days}`.length
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
            system: `Você é um estrategista de conteúdo para Instagram especializado em crescimento orgânico.
Sua tarefa é criar um calendário editorial completo e estratégico.

## Regras:
1. Gere um calendário em formato estruturado.
2. Para cada dia, inclua: tipo de conteúdo, tema, melhor horário para postar, objetivo.
3. Varie entre os tipos de conteúdo solicitados.
4. Use formato Markdown para organização.
5. Inclua sugestões de séries/quadros recorrentes.
6. Separe cada dia com --- para facilitar o parsing.
7. Considere que segunda, quarta e sexta são melhores para feed; terça e quinta para reels; todos os dias para stories.
8. Inclua métricas esperadas por tipo de conteúdo.

## Formato por dia:
### Dia X — [DIA DA SEMANA] [DATA]
- **Tipo**: [post/reel/story/carousel]
- **Horário**: [melhor horário]
- **Tema**: [descrição do tema]
- **Legenda**: [resumo breve da legenda]
- **Visual**: [descrição breve do visual]
- **Objetivo**: [engajamento/tráfego/vendas/autoridade]
- **Hashtags sugeridas**: [5-10 hashtags]
---`,
        prompt: `Crie um calendário editorial de Instagram para ${days} dias:

**Nicho/Segmento**: ${niche}
**Tipos de conteúdo**: ${contentTypes.join(', ')}
**Objetivos**: ${objectives.join(', ')}

Gere um plano detalhado, estratégico e pronto para execução.`,
        })

        logger.log('generation_started', { days, niche })

        await recordAiUsageEvent(usageContext, {
            status: 'started',
            inputChars,
            metadata: {
                days,
                contentTypesCount: contentTypes.length,
                objectivesCount: objectives.length,
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

        return Response.json({ error: 'Erro ao gerar calendário', requestId: logger.requestId }, { status: 500, headers: { 'x-request-id': logger.requestId } })
    }
}

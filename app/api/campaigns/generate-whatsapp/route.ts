import { streamText } from 'ai'
import { geminiModel, DEV_AI_MAX_TOKENS } from '@/lib/ai'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { createApiRequestLogger, isAuthError } from '@/lib/api-observability'
import { enforceAiUsagePolicy, recordAiUsageEvent } from '@/lib/ai-governance'
import { z } from 'zod'

const requestSchema = z.object({
    channel: z.enum(['whatsapp', 'sms']),
    objective: z.string().min(1),
    tone: z.string().min(1),
    audience: z.string().optional(),
    details: z.string().optional(),
    campaignName: z.string().optional(),
})

const OBJECTIVES: Record<string, string> = {
    promocao: 'Promoção com offerta, desconto ou lançamento de produto/serviço',
    followup: 'Follow-up para retomar contato com o lead',
    reengajamento: 'Reengajamento de contatos inativos',
    confirmacao: 'Confirmação de agendamento ou pedido',
    lembrete: 'Lembrete de prazo, evento ou vencimento',
    boas_vindas: 'Boas-vindas para novo contato ou cliente',
}

const TONES: Record<string, string> = {
    formal: 'formal e profissional',
    casual: 'casual e amigável',
    urgente: 'urgente, com senso de escassez e ação imediata',
    empático: 'empático e próximo',
}

export async function POST(request: Request) {
    const logger = createApiRequestLogger('campaigns/generate-whatsapp')
    let usageContext: { organizationId: string; userId: string; requestId: string; routeScope: string; featureKey: string; model: string; provider: 'google' } | null = null

    try {
        const { orgId, userId } = await getAuthContext()
        const rawBody = await request.json()

        const parsed = requestSchema.safeParse(rawBody)
        if (!parsed.success) {
            return Response.json(
                { error: 'Dados inválidos', details: parsed.error.issues, requestId: logger.requestId },
                { status: 400, headers: { 'x-request-id': logger.requestId } },
            )
        }

        const { channel, objective, tone, audience, details, campaignName } = parsed.data

        usageContext = {
            organizationId: orgId,
            userId,
            requestId: logger.requestId,
            routeScope: 'campaigns/generate-whatsapp',
            featureKey: `${channel}_campaign_text`,
            model: 'gemini-2.5-flash',
            provider: 'google',
        }

        const guard = await enforceAiUsagePolicy(usageContext)
        if (!guard.allowed) {
            await recordAiUsageEvent(usageContext, {
                status: 'blocked',
                inputChars: `${audience ?? ''}${details ?? ''}${campaignName ?? ''}`.length,
                errorCode: guard.status === 429 ? 'daily_limit_reached' : 'monthly_budget_reached',
            })
            return Response.json({ error: guard.error, requestId: logger.requestId }, {
                status: guard.status,
                headers: { 'x-request-id': logger.requestId },
            })
        }

        const objectiveDesc = OBJECTIVES[objective] ?? objective
        const toneDesc = TONES[tone] ?? tone
        const isWhatsApp = channel === 'whatsapp'

        const systemPrompt = isWhatsApp
            ? `Você é um especialista em marketing conversacional e copywriting para WhatsApp Business.
Sua tarefa é criar mensagens de WhatsApp eficazes para campanhas de marketing.

## Regras obrigatórias:
1. Mensagem em português do Brasil, tom ${toneDesc}.
2. Máximo 300 palavras. Seja direto e objetivo.
3. Use formatação nativa do WhatsApp:
   - *negrito* para destaques importantes
   - _itálico_ para ênfase sutil
   - Emojis estratégicos para engajamento (máximo 5, no início de linhas ou CTAs)
4. As variáveis disponíveis são: {{nome}} (substituído pelo nome do contato) e {{telefone}}.
5. Sempre inclua um CTA (call-to-action) claro ao final.
6. NÃO use HTML, links genéricos ou placeholders como [LINK].
7. Inclua uma linha de abertura personalizada com {{nome}}.
8. Retorne APENAS o texto da mensagem, sem explicações.`
            : `Você é um especialista em SMS marketing.
Sua tarefa é criar mensagens SMS eficazes para campanhas.

## Regras obrigatórias:
1. Mensagem em português do Brasil, tom ${toneDesc}.
2. Máximo 160 caracteres (1 SMS). Se necessário usar 2 SMS, separe com linha em branco.
3. Sem emojis (podem não renderizar corretamente).
4. As variáveis disponíveis são: {{nome}} e {{telefone}}.
5. Use apenas texto simples, sem formatação especial.
6. Inclua CTA e informação de opt-out quando relevante.
7. Retorne APENAS o texto da mensagem SMS, sem explicações.`

        const userPrompt = `Crie uma mensagem de ${isWhatsApp ? 'WhatsApp' : 'SMS'} para campanha:

Nome da campanha: ${campaignName || 'Campanha'}
Objetivo: ${objectiveDesc}
Tom de voz: ${toneDesc}
Público-alvo: ${audience || 'todos os contatos'}
Detalhes adicionais: ${details || 'nenhum'}`

        await recordAiUsageEvent(usageContext, {
            status: 'started',
            inputChars: userPrompt.length,
            metadata: { objective, tone, channel },
        })

        const result = streamText({
            model: geminiModel,
            maxTokens: DEV_AI_MAX_TOKENS,
            system: systemPrompt,
            prompt: userPrompt,
        })

        logger.log('generation_started', { channel, objective, tone })

        return result.toTextStreamResponse({
            headers: { 'x-request-id': logger.requestId },
        })

    } catch (error) {
        logger.error('generation_failed', error)
        if (isAuthError(error)) {
            return Response.json({ error: 'Não autorizado', requestId: logger.requestId }, { status: 401 })
        }
        const message = error instanceof Error ? error.message : 'Erro interno'
        return Response.json({ error: message, requestId: logger.requestId }, { status: 500 })
    }
}

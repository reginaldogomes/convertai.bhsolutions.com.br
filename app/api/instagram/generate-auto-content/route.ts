import { streamText } from 'ai'
import { geminiModel } from '@/lib/ai'
import { getAuthContext } from '@/infrastructure/auth'
import { instagramAutoConfigRepo } from '@/application/services/container'
import { z } from 'zod'
import { createApiRequestLogger, isAuthError } from '@/lib/api-observability'

const autoContentSchema = z.object({
    weeks: z.number().int().min(1).max(12).optional().default(1),
})

export async function POST(request: Request) {
    const logger = createApiRequestLogger('instagram/generate-auto-content')

    try {
        const { orgId } = await getAuthContext()
        const parsed = autoContentSchema.safeParse(await request.json())

        if (!parsed.success) {
            return Response.json(
                {
                    error: 'Payload inválido para geração automática',
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

        const { weeks } = parsed.data

        const config = await instagramAutoConfigRepo.findByOrgId(orgId)
        if (!config || !config.niche) {
            return new Response('Configuração automática não encontrada', {
                status: 400,
                headers: { 'x-request-id': logger.requestId },
            })
        }

        const contentTypesDesc = config.content_types.join(', ')
        const objectivesDesc = config.objectives.join(', ')
        const hashtagStrategyDesc: Record<string, string> = {
        trending: 'Usar hashtags em alta e tendências do momento',
        niche: 'Usar hashtags específicas do nicho com menor concorrência',
        branded: 'Priorizar hashtags da marca',
        mix: 'Mistura equilibrada de hashtags trending, nicho e branded',
        }

        const result = streamText({
            model: geminiModel,
            system: `Você é um estrategista de conteúdo para Instagram especializado em ${config.niche}.
Crie conteúdo que combina estratégia de crescimento com a identidade da marca.
Idioma: ${config.language}.`,
            prompt: `Gere um plano de conteúdo para Instagram para ${weeks} semana(s) com base nas seguintes configurações:

NICHO: ${config.niche}
DESCRIÇÃO DA MARCA: ${config.brand_description || 'Não especificada'}
PÚBLICO-ALVO: ${config.target_audience || 'Não especificado'}
TOM DE VOZ: ${config.tone}
TIPOS DE CONTEÚDO: ${contentTypesDesc}
OBJETIVOS: ${objectivesDesc}
FREQUÊNCIA: ${config.posts_per_week} posts por semana
ESTRATÉGIA DE HASHTAGS: ${hashtagStrategyDesc[config.hashtag_strategy] || config.hashtag_strategy}
${config.default_hashtags.length > 0 ? `HASHTAGS FIXAS: ${config.default_hashtags.map(h => `#${h}`).join(' ')}` : ''}
ESTILO VISUAL: ${config.visual_style}
ESTILO DE CTA: ${config.cta_style === 'direto' ? 'CTA direto e objetivo' : config.cta_style === 'sutil' ? 'CTA sutil e natural' : config.cta_style}
${config.avoid_topics ? `EVITAR TEMAS: ${config.avoid_topics}` : ''}
${config.reference_profiles.length > 0 ? `PERFIS DE REFERÊNCIA: @${config.reference_profiles.join(', @')}` : ''}

Para cada dia, gere:
1. **Tipo** de conteúdo (${contentTypesDesc})
2. **Tema/Gancho** do post
3. **Legenda completa** otimizada (com emojis e quebras de linha)
4. **Hashtags** (15-25, seguindo a estratégia definida)
5. **Descrição do criativo/visual** (dica para a imagem/vídeo)
6. **Melhor horário** para postar
7. **CTA** sugerido

Organize por dia da semana. Formate em Markdown com headers claros.
Garanta variedade nos temas e formatos. Alterne entre conteúdo educacional, entretenimento, autoridade e vendas conforme os objetivos definidos.`,
        })

        logger.log('generation_started', { weeks, orgId })
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

        return Response.json({ error: 'Erro ao gerar conteúdo automático', requestId: logger.requestId }, { status: 500, headers: { 'x-request-id': logger.requestId } })
    }
}

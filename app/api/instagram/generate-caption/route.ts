import { streamText } from 'ai'
import { geminiModel, powerModel } from '@/lib/ai'
import { getAuthContext } from '@/infrastructure/auth'

const CONTENT_TYPES: Record<string, string> = {
    post: 'Post para feed do Instagram (imagem estática com legenda)',
    story: 'Story do Instagram (conteúdo efêmero, 24h)',
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

export async function POST(request: Request) {
    await getAuthContext()
    const body = await request.json()

    const {
        contentType,
        objective,
        tone,
        topic,
        details,
        targetAudience,
        includeHashtags,
        includeEmojis,
    } = body as {
        contentType: string
        objective: string
        tone: string
        topic: string
        details: string
        targetAudience: string
        includeHashtags: boolean
        includeEmojis: boolean
    }

    const typeDesc = CONTENT_TYPES[contentType] ?? contentType
    const objectiveDesc = OBJECTIVES[objective] ?? objective
    const toneDesc = TONES[tone] ?? tone

    const result = streamText({
        model: geminiModel,
        system: `Você é um especialista em marketing digital e criação de conteúdo para Instagram.
Sua tarefa é gerar conteúdo otimizado para Instagram que maximiza engajamento e alcance.

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

    return result.toTextStreamResponse()
}

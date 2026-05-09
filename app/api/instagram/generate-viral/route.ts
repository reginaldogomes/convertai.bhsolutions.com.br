/**
 * POST /api/instagram/generate-viral
 *
 * RAG-powered viral content generator for Instagram.
 * Uses the org's knowledge base context + Gemini to produce:
 *   - 3 caption variations (short / medium / long-form)
 *   - Hook options for first lines
 *   - CTA suggestions
 *   - 25 targeted hashtags
 *   - Best time to post recommendation
 *   - Content angle ideas
 *
 * Streams a structured JSON response.
 */

import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY,
})

export async function POST(request: Request) {
    try {
        const { orgId } = await getAuthContext()
        const body = await request.json() as {
            topic: string
            contentType?: string
            tone?: string
            objective?: string
            audience?: string
            language?: string
            includeHashtags?: boolean
            includeEmojis?: boolean
        }

        const {
            topic,
            contentType = 'post',
            tone = 'engajante',
            objective = 'engajamento',
            audience = 'público geral',
            language = 'pt-BR',
            includeHashtags = true,
            includeEmojis = true,
        } = body

        if (!topic?.trim()) {
            return new Response(JSON.stringify({ error: 'Tópico é obrigatório' }), { status: 400 })
        }

        // Fetch RAG context + auto-config in parallel
        const { ragContext, autoConfig } = await useCases.generateViralIdea().getContext(orgId, topic)

        const configContext = autoConfig ? `
Perfil da marca:
- Nicho: ${autoConfig.niche}
- Descrição: ${autoConfig.brand_description || 'Não informada'}
- Público-alvo: ${autoConfig.target_audience || audience}
- Tom de voz: ${autoConfig.tone || tone}
- Estilo visual: ${autoConfig.visual_style || 'moderno'}
- Objetivos: ${autoConfig.objectives?.join(', ') || objective}
- Hashtags padrão: ${autoConfig.default_hashtags?.map(h => `#${h}`).join(' ') || 'nenhuma'}
- Tópicos a evitar: ${autoConfig.avoid_topics || 'nenhum'}
`.trim() : `Tom de voz: ${tone}\nObjetivo: ${objective}\nPúblico-alvo: ${audience}`

        const prompt = `Você é um especialista em marketing viral para Instagram com profundo conhecimento em psicologia do consumidor, gatilhos mentais e algoritmos de redes sociais.

${ragContext ? `\n${ragContext}\n` : ''}

${configContext}

Crie conteúdo viral de alta performance para Instagram sobre o seguinte tópico:
"${topic}"

Tipo de conteúdo: ${contentType}
Idioma: ${language}
${includeEmojis ? 'Use emojis estrategicamente para aumentar engajamento.' : 'Não use emojis.'}

Retorne um JSON válido com esta estrutura exata:
{
  "captions": [
    {
      "style": "impacto",
      "length": "curta",
      "text": "legenda curta e de alto impacto (até 100 chars)",
      "hook": "primeira linha que prende a atenção"
    },
    {
      "style": "storytelling",
      "length": "média",
      "text": "legenda com narrativa (100-300 chars)",
      "hook": "abertura com storytelling"
    },
    {
      "style": "educativo",
      "length": "longa",
      "text": "legenda educativa detalhada (300-500 chars)",
      "hook": "hook com dado ou pergunta provocativa"
    }
  ],
  "hooks": [
    "hook 1 — pergunta provocativa",
    "hook 2 — dado surpreendente",
    "hook 3 — afirmação controversa",
    "hook 4 — promessa de valor",
    "hook 5 — identificação com dor do público"
  ],
  "ctas": [
    "CTA 1 — ação clara e urgente",
    "CTA 2 — engajamento (salva/compartilha)",
    "CTA 3 — conversão (link na bio / DM)"
  ],
  "hashtags": {
    "niche": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
    "trending": ["#hashtag6", "#hashtag7", "#hashtag8", "#hashtag9", "#hashtag10"],
    "branded": ["#hashtag11", "#hashtag12"],
    "broad": ["#hashtag13", "#hashtag14", "#hashtag15", "#hashtag16", "#hashtag17", "#hashtag18", "#hashtag19", "#hashtag20"]
  },
  "contentAngles": [
    {
      "angle": "Educativo",
      "description": "como abordar o tema de forma educativa",
      "format": "carrossel"
    },
    {
      "angle": "Entretenimento",
      "description": "abordagem leve e divertida",
      "format": "reel"
    },
    {
      "angle": "Autoridade",
      "description": "posiciona como especialista",
      "format": "post"
    },
    {
      "angle": "Prova Social",
      "description": "usa resultados e depoimentos",
      "format": "carrossel"
    },
    {
      "angle": "Trending",
      "description": "associa ao que está em alta",
      "format": "reel"
    }
  ],
  "bestPostTime": {
    "days": ["terça", "quarta", "quinta"],
    "times": ["08:00", "12:00", "19:00"],
    "rationale": "explicação baseada no tipo de conteúdo e público"
  },
  "visualSuggestion": "descrição do visual ideal para este conteúdo (cores, estilo, composição)",
  "viralScore": 85,
  "viralScoreReason": "por que este conteúdo tem alto potencial viral"
}

Retorne APENAS o JSON, sem markdown, sem explicações fora do JSON.`

        const result = streamText({
            model: google('gemini-2.5-flash'),
            prompt,
            temperature: 0.85,
        })

        return result.toTextStreamResponse()
    } catch (err) {
        console.error('[instagram/generate-viral] Error', err)
        return new Response(JSON.stringify({ error: 'Erro ao gerar conteúdo' }), { status: 500 })
    }
}

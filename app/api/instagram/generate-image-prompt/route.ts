import { streamText } from 'ai'
import { powerModel } from '@/lib/ai'
import { getAuthContext } from '@/infrastructure/auth'

export async function POST(request: Request) {
    await getAuthContext()
    const body = await request.json()

    const { topic, contentType, style, targetAudience } = body as {
        topic: string
        contentType: string
        style: string
        targetAudience: string
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

    return result.toTextStreamResponse()
}

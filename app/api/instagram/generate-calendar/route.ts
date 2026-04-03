import { streamText } from 'ai'
import { powerModel } from '@/lib/ai'
import { getAuthContext } from '@/infrastructure/auth'

export async function POST(request: Request) {
    await getAuthContext()
    const body = await request.json()

    const { niche, days, contentTypes, objectives } = body as {
        niche: string
        days: number
        contentTypes: string[]
        objectives: string[]
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

    return result.toTextStreamResponse()
}

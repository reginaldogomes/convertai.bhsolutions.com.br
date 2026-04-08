import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { powerModel } from '@/lib/ai'
import { getAuthContext } from '@/infrastructure/auth'
import { createApiRequestLogger, isAuthError, jsonWithRequestId } from '@/lib/api-observability'

const productAISchema = z.object({
    shortDescription: z.string().describe('Descrição curta e persuasiva do produto, 1-2 frases'),
    fullDescription: z.string().describe('Descrição completa e detalhada do produto com 3-5 parágrafos'),
    targetAudience: z.string().describe('Descrição detalhada do público-alvo ideal'),
    differentials: z.string().describe('Diferenciais competitivos do produto'),
    features: z.array(z.object({
        title: z.string().describe('Nome da funcionalidade'),
        description: z.string().describe('Descrição clara da funcionalidade'),
    })).min(3).max(8).describe('Funcionalidades principais do produto'),
    benefits: z.array(z.object({
        title: z.string().describe('Nome do benefício'),
        description: z.string().describe('Descrição do resultado para o cliente'),
    })).min(3).max(8).describe('Benefícios concretos para o cliente'),
    faqs: z.array(z.object({
        question: z.string().describe('Pergunta frequente'),
        answer: z.string().describe('Resposta completa e persuasiva'),
    })).min(3).max(6).describe('Perguntas frequentes sobre o produto'),
    tags: z.array(z.string()).min(3).max(10).describe('Tags relevantes para categorização, no máximo 10'),
    suggestedSlug: z.string().describe('Slug sugerido para URL, apenas letras minúsculas, números e hifens'),
})

const SYSTEM_PROMPT = `Você é um especialista em marketing digital e copywriting para produtos digitais brasileiros.
Sua tarefa é gerar conteúdo rico e persuasivo para cadastro de produtos/serviços digitais.

O conteúdo gerado será usado para:
1. Landing pages de venda do produto
2. Base de conhecimento RAG para um chatbot de atendimento IA
3. Campanhas de email marketing
4. Contexto para agentes de IA de vendas

DIRETRIZES:
- Escreva sempre em português brasileiro (pt-BR)
- Use tom profissional mas acessível
- Seja específico e detalhado — quanto mais contexto, melhor o chatbot funciona
- Benefícios devem focar em resultados concretos para o cliente
- Features devem ser claras e diferenciadas
- FAQs devem antecipar dúvidas reais de compradores
- Tags devem ser relevantes para SEO e categorização
- A descrição completa deve ser rica o suficiente para alimentar o RAG`

export async function POST(request: NextRequest) {
    const logger = createApiRequestLogger('products/generate')

    try {
        logger.log('request_received')
        await getAuthContext()

        const body = await request.json()
        const { name, type, context } = body as {
            name: string
            type: 'product' | 'service'
            context?: string
        }

        if (!name || !type) {
            return jsonWithRequestId(
                logger.requestId,
                { error: 'Nome e tipo são obrigatórios', requestId: logger.requestId },
                { status: 400 }
            )
        }

        const prompt = [
            `Gere conteúdo completo para o seguinte ${type === 'product' ? 'produto digital' : 'serviço digital'}:`,
            `Nome: ${name}`,
            context ? `\nContexto adicional fornecido pelo usuário:\n${context}` : '',
            `\nGere conteúdo rico, persuasivo e detalhado. O slug deve ser baseado no nome.`,
        ].filter(Boolean).join('\n')

        const { object } = await generateObject({
            model: powerModel,
            schema: productAISchema,
            system: SYSTEM_PROMPT,
            prompt,
            temperature: 0.6,
            maxOutputTokens: 8192,
        })

        logger.log('generation_succeeded', {
            type,
            hasContext: Boolean(context),
            featuresCount: object.features.length,
            benefitsCount: object.benefits.length,
        })

        return jsonWithRequestId(logger.requestId, object)
    } catch (error) {
        logger.error('generation_failed', error)

        if (isAuthError(error)) {
            return jsonWithRequestId(logger.requestId, { error: 'Não autenticado', requestId: logger.requestId }, { status: 401 })
        }

        return jsonWithRequestId(logger.requestId, { error: 'Erro ao gerar conteúdo', requestId: logger.requestId }, { status: 500 })
    }
}

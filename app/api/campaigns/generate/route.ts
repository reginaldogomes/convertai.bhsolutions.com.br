import { streamText } from 'ai'
import { geminiModel } from '@/lib/ai'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import type { CrmContext } from '@/application/use-cases/campaigns/get-crm-context'

const OBJECTIVES: Record<string, string> = {
    promocao: 'Campanha promocional com ofertas, descontos ou lançamento de produto/serviço',
    newsletter: 'Newsletter informativa com atualizações, novidades e conteúdo relevante',
    followup: 'Follow-up para contatos que já tiveram interação prévia, reforçando relacionamento',
    reengajamento: 'Reengajamento de contatos inativos, incentivando retorno',
    convite: 'Convite para evento, webinar, reunião ou demonstração',
    boas_vindas: 'Email de boas-vindas para novos contatos ou clientes',
}

const TONES: Record<string, string> = {
    formal: 'Tom formal e profissional, linguagem corporativa',
    casual: 'Tom casual e amigável, próximo e acessível',
    urgente: 'Tom de urgência, com senso de escassez e ação imediata',
    informativo: 'Tom informativo e educativo, foco em agregar valor',
}

function buildCrmPromptContext(ctx: CrmContext): string {
    const pastCampaignsSummary = ctx.pastCampaigns
        .map(c => `- "${c.name}" (assunto: "${c.subject}") — abertura: ${c.openRate}%, cliques: ${c.clickRate}%`)
        .join('\n')

    return `
## Dados do CRM da organização "${ctx.orgName}"
- Total de contatos: ${ctx.contactCount}
- Tags mais usadas: ${ctx.allTags.join(', ') || 'nenhuma'}
- Empresas dos contatos: ${ctx.companies.join(', ') || 'não informado'}
- Pipeline de deals: ${Object.entries(ctx.stageDistribution).map(([k, v]) => `${k}: ${v}`).join(', ') || 'sem deals'}
${ctx.pastCampaigns.length > 0 ? `\n## Campanhas enviadas anteriormente (para referência de estilo)\n${pastCampaignsSummary}` : ''}
`
}

export async function POST(request: Request) {
    const { orgId, userId } = await getAuthContext()
    const body = await request.json()

    const {
        objective,
        tone,
        audience,
        details,
        campaignName,
        campaignSubject,
    } = body as {
        objective: string
        tone: string
        audience: string
        details: string
        campaignName: string
        campaignSubject: string
    }

    const ctx = await useCases.getCrmContext().execute(orgId, userId)
    const crmContext = buildCrmPromptContext(ctx)

    const objectiveDesc = OBJECTIVES[objective] ?? objective
    const toneDesc = TONES[tone] ?? tone

    const result = streamText({
        model: geminiModel,
        system: `Você é um especialista em email marketing e design de emails HTML responsivos.
Sua tarefa é gerar o HTML completo de um email de campanha.

## Regras obrigatórias de HTML para email:
1. Use APENAS HTML com CSS inline (atributo style=""). Nenhuma tag <style> ou <link>.
2. Use layout baseado em <table> para máxima compatibilidade (Outlook, Gmail, Apple Mail).
3. Largura máxima de 600px, centralizado.
4. Use fontes seguras: Arial, Helvetica, sans-serif.
5. Todas as cores devem ser inline. Use a paleta da marca: vermelho #ff0000 como cor de destaque/CTA, fundo escuro #2c2f36 para headers/footers, cinza #85888f para textos secundários, branco #ffffff para fundo principal.
6. Inclua um botão CTA (call-to-action) estilizado com fundo vermelho #ff0000, texto branco, padding de 12px 24px, border-radius 6px.
7. As variáveis de personalização disponíveis são: {{nome}} (nome do contato) e {{email}} (email do contato). Use-as nos lugares apropriados.
8. O HTML deve ser completo (com <!DOCTYPE> e <html>) e pronto para envio.
9. Inclua alt text em todas as imagens (use placeholders descritivos).
10. Inclua preheader text oculto no início do body.
11. Inclua link de descadastro no rodapé.

## Contexto do CRM:
${crmContext}

Retorne APENAS o código HTML, sem explicações, sem markdown, sem blocos de código.`,
        prompt: `Gere o HTML de uma campanha de email com as seguintes especificações:

**Nome da campanha:** ${campaignName || 'Não definido'}
**Assunto:** ${campaignSubject || 'Não definido'}
**Objetivo:** ${objectiveDesc}
**Tom de voz:** ${toneDesc}
**Público-alvo:** ${audience || 'Todos os contatos'}
**Detalhes adicionais:** ${details || 'Nenhum detalhe adicional'}

Gere um email HTML profissional, responsivo e visualmente atraente.`,
    })

    return result.toTextStreamResponse()
}

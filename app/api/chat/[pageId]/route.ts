import { streamText } from 'ai'
import { agentModel } from '@/lib/ai'
import {
    landingPageRepo,
    chatSessionRepo,
    contactRepoSingleton as contactRepo,
    analyticsRepo,
    ragService,
} from '@/application/services/container'

export async function POST(
    req: Request,
    { params }: { params: Promise<{ pageId: string }> }
) {
    const { pageId } = await params
    const body = await req.json()
    const { message, visitorId, sessionId: existingSessionId } = body as {
        message: string
        visitorId: string
        sessionId?: string
    }

    if (!message || !visitorId) {
        return Response.json({ error: 'message and visitorId are required' }, { status: 400 })
    }

    // 1. Load landing page
    const page = await landingPageRepo.findById(pageId)
    if (!page || !page.isPublished()) {
        return Response.json({ error: 'Page not found' }, { status: 404 })
    }

    // 2. Get or create chat session
    let session = existingSessionId
        ? await chatSessionRepo.findById(existingSessionId)
        : await chatSessionRepo.findByVisitor(pageId, visitorId)

    if (!session) {
        session = await chatSessionRepo.create({ landingPageId: pageId, visitorId })
        if (!session) {
            return Response.json({ error: 'Failed to create session' }, { status: 500 })
        }
        // Track chat_start event
        analyticsRepo.track({
            landingPageId: pageId,
            eventType: 'chat_start',
            sessionId: session.id,
            visitorId,
        })
    }

    // 3. Save the user message
    await chatSessionRepo.addMessage({
        sessionId: session.id,
        role: 'user',
        content: message,
    })

    // 4. RAG — search knowledge base for relevant context
    const ragMatches = await ragService.search(message, page.organizationId, pageId)
    const ragContext = ragService.formatContextForLLM(ragMatches)

    // 5. Get conversation history
    const history = await chatSessionRepo.getMessages(session.id)
    const conversationMessages = history.slice(-20).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
    }))

    // 6. Detect lead info in message (name + email pattern)
    const leadInfo = extractLeadInfo(message)
    if (leadInfo && !session.hasLead()) {
        const contact = await contactRepo.create({
            organizationId: page.organizationId,
            name: leadInfo.name,
            email: leadInfo.email,
            phone: leadInfo.phone,
            company: null,
            tags: ['landing-page', page.slug],
            notes: `Lead capturado via landing page: ${page.name}`,
        })
        if (contact) {
            await chatSessionRepo.updateContactId(session.id, contact.id)
            analyticsRepo.track({
                landingPageId: pageId,
                eventType: 'lead_captured',
                sessionId: session.id,
                visitorId,
                metadata: { contactId: contact.id },
            })
        }
    }

    // 7. Build the system prompt with RAG context
    const systemPrompt = buildSystemPrompt(page, ragContext, !session.hasLead() && !leadInfo)

    // 8. Stream the response
    const result = await streamText({
        model: agentModel,
        system: systemPrompt,
        messages: conversationMessages,
        async onFinish({ text }) {
            if (text) {
                await chatSessionRepo.addMessage({
                    sessionId: session!.id,
                    role: 'assistant',
                    content: text,
                })
            }
        },
    })

    return result.toTextStreamResponse()
}

function buildSystemPrompt(
    page: { chatbotName: string; chatbotSystemPrompt: string; name: string },
    ragContext: string,
    shouldCaptureLeads: boolean,
): string {
    let prompt = `Você é ${page.chatbotName}, assistente virtual da página "${page.name}".

${page.chatbotSystemPrompt}

Regras importantes:
- Responda SEMPRE em português brasileiro
- Seja conciso e útil
- Se não souber algo, diga que não tem essa informação no momento
- Nunca invente informações que não estão no contexto fornecido`

    if (ragContext) {
        prompt += `\n\n${ragContext}\n\nUse o contexto acima para responder às perguntas. Priorize informações do contexto.`
    }

    if (shouldCaptureLeads) {
        prompt += `\n\nIMPORTANTE: Quando natural na conversa, peça educadamente o nome e email do visitante para que possamos enviar mais informações. Não force — espere o momento certo.`
    }

    return prompt
}

function extractLeadInfo(text: string): { name: string; email: string; phone: string | null } | null {
    const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)
    if (!emailMatch) return null

    const email = emailMatch[0]

    // Try to extract name — look for patterns like "meu nome é X", "sou o/a X", "me chamo X"
    const namePatterns = [
        /(?:meu nome é|me chamo|sou o|sou a|sou)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i,
        /(?:nome[:\s]+)([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i,
    ]

    let name = 'Visitante'
    for (const pattern of namePatterns) {
        const match = text.match(pattern)
        if (match?.[1]) {
            name = match[1].trim()
            break
        }
    }

    // Try to extract phone
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2}\)?[-.\s]?\d{4,5}[-.\s]?\d{4}/)
    const phone = phoneMatch ? phoneMatch[0] : null

    return { name, email, phone }
}

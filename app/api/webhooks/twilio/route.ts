import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from 'twilio'
import { HandleInboundMessageUseCase } from '@/application/use-cases/messages/handle-inbound'
import { SupabaseMessageRepository } from '@/infrastructure/repositories/message-repository'
import { SupabaseContactRepository } from '@/infrastructure/repositories/contact-repository'

const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!
const WEBHOOK_ORG_ID = process.env.TWILIO_WEBHOOK_ORG_ID!

/**
 * POST /api/webhooks/twilio
 * Receives inbound WhatsApp messages from Twilio.
 * Verifies signature, finds/creates contact, persists message.
 */
export async function POST(request: NextRequest) {
    // 1. Read raw body for signature verification
    const body = await request.text()
    const params = Object.fromEntries(new URLSearchParams(body))

    // 2. Verify Twilio signature
    const signature = request.headers.get('x-twilio-signature') ?? ''
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`

    const isValid = validateRequest(TWILIO_AUTH_TOKEN, signature, url, params)
    if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // 3. Extract message data
    const from = params.From ?? ''          // "whatsapp:+5511999999999"
    const messageBody = params.Body ?? ''
    const messageSid = params.MessageSid ?? ''

    if (!from || !messageBody) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 4. Process inbound message
    const useCase = new HandleInboundMessageUseCase(
        new SupabaseMessageRepository(),
        new SupabaseContactRepository(),
        WEBHOOK_ORG_ID,
    )

    const result = await useCase.execute({
        from,
        body: messageBody,
        messageSid,
        channel: 'whatsapp',
    })

    if (!result) {
        return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
    }

    // 5. Return TwiML empty response (no auto-reply)
    return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        {
            status: 200,
            headers: { 'Content-Type': 'text/xml' },
        },
    )
}

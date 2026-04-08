import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from 'twilio'
import { HandleInboundMessageUseCase } from '@/application/use-cases/messages/handle-inbound'
import { SupabaseMessageRepository } from '@/infrastructure/repositories/message-repository'
import { SupabaseContactRepository } from '@/infrastructure/repositories/contact-repository'
import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchAutomationEvent } from '@/lib/automation-dispatcher'
import { createApiRequestLogger, jsonWithRequestId } from '@/lib/api-observability'
import { z } from 'zod'

const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!

const twilioWebhookSchema = z.object({
    From: z.string().min(1),
    Body: z.string().min(1),
    MessageSid: z.string().optional(),
})

async function getOrgId(): Promise<string | null> {
    const supabase = createAdminClient()
    const { data } = await supabase.from('organizations').select('id').limit(1).single()
    return data?.id ?? null
}

/**
 * POST /api/webhooks/twilio
 * Receives inbound WhatsApp messages from Twilio.
 * Verifies signature, finds/creates contact, persists message.
 */
export async function POST(request: NextRequest) {
    const logger = createApiRequestLogger('webhooks/twilio')

    try {
        // 1. Read raw body for signature verification
        const body = await request.text()
        const params = Object.fromEntries(new URLSearchParams(body))

        // 2. Verify Twilio signature
        const signature = request.headers.get('x-twilio-signature') ?? ''
        const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`

        const isValid = validateRequest(TWILIO_AUTH_TOKEN, signature, url, params)
        if (!isValid) {
            logger.log('invalid_signature')
            return jsonWithRequestId(logger.requestId, { error: 'Invalid signature', requestId: logger.requestId }, { status: 403 })
        }

        const parsed = twilioWebhookSchema.safeParse(params)
        if (!parsed.success) {
            return jsonWithRequestId(
                logger.requestId,
                {
                    error: 'Invalid webhook payload',
                    requestId: logger.requestId,
                    details: parsed.error.issues.map((issue) => ({
                        path: issue.path.join('.'),
                        message: issue.message,
                    })),
                },
                { status: 400 }
            )
        }

        // 3. Extract message data
        const { From: from, Body: messageBody, MessageSid: messageSid = '' } = parsed.data

        // 4. Process inbound message
        const orgId = await getOrgId()
        if (!orgId) {
            return jsonWithRequestId(logger.requestId, { error: 'Organization not found', requestId: logger.requestId }, { status: 500 })
        }

        const useCase = new HandleInboundMessageUseCase(
            new SupabaseMessageRepository(),
            new SupabaseContactRepository(),
            orgId,
        )

        const result = await useCase.execute({
            from,
            body: messageBody,
            messageSid,
            channel: 'whatsapp',
        })

        if (!result) {
            return jsonWithRequestId(logger.requestId, { error: 'Failed to process message', requestId: logger.requestId }, { status: 500 })
        }

        logger.log('message_processed', {
            orgId,
            contactId: result.message.contactId,
            contactCreated: result.contactCreated,
        })

        void dispatchAutomationEvent({
            orgId,
            event: 'message_received',
            context: {
                contactId: result.message.contactId,
                source: 'twilio_whatsapp',
                message: messageBody,
                metadata: { messageSid },
            },
        })

        if (result.contactCreated) {
            void dispatchAutomationEvent({
                orgId,
                event: 'new_contact',
                context: {
                    contactId: result.message.contactId,
                    source: 'twilio_whatsapp',
                    message: messageBody,
                    metadata: { messageSid },
                },
            })
        }

        // 5. Return TwiML empty response (no auto-reply)
        return new NextResponse(
            '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
            {
                status: 200,
                headers: {
                    'Content-Type': 'text/xml',
                    'x-request-id': logger.requestId,
                },
            },
        )
    } catch (error) {
        logger.error('request_failed', error)
        return jsonWithRequestId(
            logger.requestId,
            { error: 'Failed to process webhook', requestId: logger.requestId },
            { status: 500 }
        )
    }
}

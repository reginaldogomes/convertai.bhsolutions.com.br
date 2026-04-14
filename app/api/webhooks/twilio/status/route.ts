import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from 'twilio'
import { SupabaseCampaignRecipientRepository } from '@/infrastructure/repositories/campaign-recipient-repository'
import { createApiRequestLogger, jsonWithRequestId } from '@/lib/api-observability'
import { z } from 'zod'
import type { CampaignRecipientStatus } from '@/types/database'

const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!

/**
 * Mapeamento dos status Twilio → status interno do destinatário
 * Ref: https://www.twilio.com/docs/sms/api/message-resource#message-status-values
 */
const statusMap: Record<string, CampaignRecipientStatus> = {
    sent: 'sent',
    delivered: 'delivered',
    read: 'read',
    failed: 'failed',
    undelivered: 'failed',
}

const twilioStatusSchema = z.object({
    MessageSid: z.string().min(1),
    MessageStatus: z.string().min(1),
    ErrorMessage: z.string().optional(),
})

/**
 * POST /api/webhooks/twilio/status
 * Recebe callbacks de delivery status do Twilio (WhatsApp e SMS).
 * Configurar este URL como StatusCallback no Twilio Console ou passar
 * como parâmetro statusCallback ao criar messages no TwilioWhatsAppService.
 */
export async function POST(request: NextRequest) {
    const logger = createApiRequestLogger('webhooks/twilio/status')

    try {
        const body = await request.text()
        const params = Object.fromEntries(new URLSearchParams(body))

        // Verificar assinatura Twilio
        const signature = request.headers.get('x-twilio-signature') ?? ''
        const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status`

        const isValid = validateRequest(TWILIO_AUTH_TOKEN, signature, url, params)
        if (!isValid) {
            logger.log('invalid_signature')
            return jsonWithRequestId(logger.requestId, { error: 'Invalid signature' }, { status: 403 })
        }

        const parsed = twilioStatusSchema.safeParse(params)
        if (!parsed.success) {
            return jsonWithRequestId(
                logger.requestId,
                { error: 'Payload inválido', details: parsed.error.issues },
                { status: 400 },
            )
        }

        const { MessageSid, MessageStatus, ErrorMessage } = parsed.data

        const internalStatus = statusMap[MessageStatus.toLowerCase()]
        if (!internalStatus) {
            // Status intermediário (queued, sending, accepted) — ignorar
            return new NextResponse(null, { status: 204 })
        }

        const recipientRepo = new SupabaseCampaignRecipientRepository()
        const now = new Date().toISOString()

        await recipientRepo.updateByTwilioSid(MessageSid, internalStatus, {
            deliveredAt: internalStatus === 'delivered' ? now : undefined,
            readAt: internalStatus === 'read' ? now : undefined,
            errorMessage: internalStatus === 'failed' ? (ErrorMessage ?? 'Falha no envio') : undefined,
        })

        logger.log('status_updated', { sid: MessageSid, status: internalStatus })
        return new NextResponse(null, { status: 204 })

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno'
        logger.log('error', { message })
        return jsonWithRequestId(logger.requestId, { error: message }, { status: 500 })
    }
}

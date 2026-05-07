import { getTwilioClient, TWILIO_WHATSAPP_NUMBER } from '@/lib/twilio'
import type { IWhatsAppService, SendWhatsAppInput, SendWhatsAppResult } from '@/domain/interfaces/whatsapp-service'

function buildStatusCallbackUrl(): string | undefined {
    const base = process.env.NEXT_PUBLIC_APP_URL
    if (!base) return undefined
    try {
        const { protocol, hostname } = new URL(base)
        // Twilio rejects localhost and non-HTTPS URLs — skip in dev
        if (hostname === 'localhost' || hostname === '127.0.0.1' || protocol !== 'https:') return undefined
        return `${base}/api/webhooks/twilio/status`
    } catch {
        return undefined
    }
}

const STATUS_CALLBACK_URL = buildStatusCallbackUrl()

export class TwilioWhatsAppService implements IWhatsAppService {
    async send(input: SendWhatsAppInput): Promise<SendWhatsAppResult> {
        if (!TWILIO_WHATSAPP_NUMBER) {
            throw new Error('TWILIO_WHATSAPP_NUMBER is required to send WhatsApp messages')
        }

        const twilio = getTwilioClient()
        const message = await twilio.messages.create({
            from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${input.to}`,
            body: input.body,
            ...(STATUS_CALLBACK_URL ? { statusCallback: STATUS_CALLBACK_URL } : {}),
        })
        return { sid: message.sid, status: message.status }
    }
}

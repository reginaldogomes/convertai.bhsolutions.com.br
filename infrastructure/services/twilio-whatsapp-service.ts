import { twilio, TWILIO_WHATSAPP_NUMBER } from '@/lib/twilio'
import type { IWhatsAppService, SendWhatsAppInput, SendWhatsAppResult } from '@/domain/interfaces/whatsapp-service'

export class TwilioWhatsAppService implements IWhatsAppService {
    async send(input: SendWhatsAppInput): Promise<SendWhatsAppResult> {
        const message = await twilio.messages.create({
            from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${input.to}`,
            body: input.body,
        })
        return { sid: message.sid, status: message.status }
    }
}

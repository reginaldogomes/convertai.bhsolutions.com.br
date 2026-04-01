import { twilio, TWILIO_SMS_NUMBER } from '@/lib/twilio'
import type { ISmsService, SendSmsInput, SendSmsResult } from '@/domain/interfaces/sms-service'

export class TwilioSmsService implements ISmsService {
    async send(input: SendSmsInput): Promise<SendSmsResult> {
        const message = await twilio.messages.create({
            from: TWILIO_SMS_NUMBER,
            to: input.to,
            body: input.body,
        })
        return { sid: message.sid, status: message.status }
    }

    async sendBatch(inputs: SendSmsInput[]): Promise<{ sent: number; failed: number }> {
        let sent = 0
        let failed = 0

        // Twilio doesn't have a batch API — send one by one with concurrency limit
        const CONCURRENCY = 10
        for (let i = 0; i < inputs.length; i += CONCURRENCY) {
            const chunk = inputs.slice(i, i + CONCURRENCY)
            const results = await Promise.allSettled(
                chunk.map(input => this.send(input)),
            )
            for (const result of results) {
                if (result.status === 'fulfilled') {
                    sent++
                } else {
                    console.error('[TwilioSmsService] Send failed:', result.reason)
                    failed++
                }
            }
        }

        return { sent, failed }
    }
}

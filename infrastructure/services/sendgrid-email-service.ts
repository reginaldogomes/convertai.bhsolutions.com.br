import { sendgrid, FROM_EMAIL, FROM_NAME } from '@/lib/sendgrid'
import type { IEmailService, SendEmailInput, SendBatchEmailInput, SendEmailResult } from '@/domain/interfaces'

const BATCH_SIZE = 1000 // SendGrid supports up to 1000 per batch call

export class SendGridEmailService implements IEmailService {
    async send(input: SendEmailInput): Promise<SendEmailResult> {
        const [response] = await sendgrid.send({
            from: { email: FROM_EMAIL, name: FROM_NAME },
            to: input.to,
            subject: input.subject,
            html: input.html,
            replyTo: input.replyTo,
            categories: input.tags,
        })

        if (response.statusCode < 200 || response.statusCode >= 300) {
            throw new Error(`SendGrid send failed with status ${response.statusCode}`)
        }

        // SendGrid doesn't return an ID in the response body, use x-message-id header
        const messageId = response.headers['x-message-id'] as string ?? 'ok'
        return { id: messageId }
    }

    async sendBatch(inputs: SendBatchEmailInput[]): Promise<{ sent: number; failed: number }> {
        let sent = 0
        let failed = 0

        for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
            const chunk = inputs.slice(i, i + BATCH_SIZE)

            try {
                await sendgrid.send(
                    chunk.map(input => ({
                        from: { email: FROM_EMAIL, name: FROM_NAME },
                        to: input.to,
                        subject: input.subject,
                        html: input.html,
                        replyTo: input.replyTo,
                        categories: input.tags,
                    })),
                )
                sent += chunk.length
            } catch (error) {
                console.error('[SendGridEmailService] Batch send failed:', error, { chunkSize: chunk.length, chunkIndex: i })
                failed += chunk.length
            }
        }

        return { sent, failed }
    }
}

import { resend, FROM_EMAIL } from '@/lib/resend'
import type { IEmailService, SendEmailInput, SendBatchEmailInput, SendEmailResult } from '@/domain/interfaces'

const BATCH_SIZE = 50  // Resend batch API limit

export class ResendEmailService implements IEmailService {
    async send(input: SendEmailInput): Promise<SendEmailResult> {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: input.to,
            subject: input.subject,
            html: input.html,
            replyTo: input.replyTo,
            tags: input.tags?.map(t => ({ name: 'campaign', value: t })),
        })

        if (error || !data) {
            throw new Error(error?.message ?? 'Failed to send email')
        }

        return { id: data.id }
    }

    async sendBatch(inputs: SendBatchEmailInput[]): Promise<{ sent: number; failed: number }> {
        let sent = 0
        let failed = 0

        // Process in chunks of BATCH_SIZE to respect Resend API limits
        for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
            const chunk = inputs.slice(i, i + BATCH_SIZE)

            const { data, error } = await resend.batch.send(
                chunk.map(input => ({
                    from: FROM_EMAIL,
                    to: input.to,
                    subject: input.subject,
                    html: input.html,
                    replyTo: input.replyTo,
                    tags: input.tags?.map(t => ({ name: 'campaign', value: t })),
                })),
            )

            if (error || !data) {
                console.error('[ResendEmailService] Batch send failed:', error?.message ?? 'Unknown error', { chunkSize: chunk.length, chunkIndex: i })
                failed += chunk.length
            } else {
                sent += data.data.length
            }
        }

        return { sent, failed }
    }
}

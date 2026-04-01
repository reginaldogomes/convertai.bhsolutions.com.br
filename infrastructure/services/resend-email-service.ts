import { Resend } from 'resend'
import type { IEmailService, SendEmailInput, SendBatchEmailInput, SendEmailResult } from '@/domain/interfaces'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@bhsolutions.com.br'
const FROM_NAME = process.env.RESEND_FROM_NAME || 'ConvertAI'

const BATCH_SIZE = 100 // Resend batch limit

export class ResendEmailService implements IEmailService {
    async send(input: SendEmailInput): Promise<SendEmailResult> {
        const { data, error } = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: input.to,
            subject: input.subject,
            html: input.html,
            replyTo: input.replyTo,
            tags: input.tags?.map(tag => ({ name: 'category', value: tag })),
        })

        if (error) {
            throw new Error(`Resend send failed: ${error.message}`)
        }

        return { id: data?.id ?? 'ok' }
    }

    async sendBatch(inputs: SendBatchEmailInput[]): Promise<{ sent: number; failed: number }> {
        let sent = 0
        let failed = 0

        for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
            const chunk = inputs.slice(i, i + BATCH_SIZE)

            try {
                const { data, error } = await resend.batch.send(
                    chunk.map(input => ({
                        from: `${FROM_NAME} <${FROM_EMAIL}>`,
                        to: input.to,
                        subject: input.subject,
                        html: input.html,
                        replyTo: input.replyTo,
                        tags: input.tags?.map(tag => ({ name: 'category', value: tag })),
                    })),
                )

                if (error) {
                    console.error('[ResendEmailService] Batch send failed:', error)
                    failed += chunk.length
                } else {
                    sent += data?.data?.length ?? chunk.length
                }
            } catch (error) {
                console.error('[ResendEmailService] Batch send failed:', error, { chunkSize: chunk.length, chunkIndex: i })
                failed += chunk.length
            }
        }

        return { sent, failed }
    }
}

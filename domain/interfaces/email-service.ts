export interface SendEmailInput {
    to: string
    subject: string
    html: string
    replyTo?: string
    tags?: string[]
}

export interface SendEmailResult {
    id: string
}

export interface SendBatchEmailInput {
    to: string
    subject: string
    html: string
    replyTo?: string
    tags?: string[]
}

export interface IEmailService {
    send(input: SendEmailInput): Promise<SendEmailResult>
    sendBatch(inputs: SendBatchEmailInput[]): Promise<{ sent: number; failed: number }>
}

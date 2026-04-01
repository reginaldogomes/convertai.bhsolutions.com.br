export interface SendSmsInput {
    to: string      // E.164 format: +5511999999999
    body: string
}

export interface SendSmsResult {
    sid: string
    status: string
}

export interface ISmsService {
    send(input: SendSmsInput): Promise<SendSmsResult>
    sendBatch(inputs: SendSmsInput[]): Promise<{ sent: number; failed: number }>
}

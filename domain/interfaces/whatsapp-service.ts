export interface SendWhatsAppInput {
    to: string      // E.164 format: +5511999999999
    body: string
}

export interface SendWhatsAppResult {
    sid: string
    status: string
}

export interface IWhatsAppService {
    send(input: SendWhatsAppInput): Promise<SendWhatsAppResult>
}

import type { CreditTransactionType } from '@/types/database'

export const CREDIT_COSTS: Record<string, number> = {
    AI_GENERATION: 10,
    WHATSAPP_PER_MESSAGE: 5,
    SMS_PER_MESSAGE: 2,
    EMAIL_PER_RECIPIENT: 1,
} as const

export const CREDIT_TYPES: Record<keyof typeof CREDIT_COSTS, CreditTransactionType> = {
    AI_GENERATION: 'usage_ai',
    WHATSAPP_PER_MESSAGE: 'usage_whatsapp',
    SMS_PER_MESSAGE: 'usage_sms',
    EMAIL_PER_RECIPIENT: 'usage_email',
}

export function creditsForCampaign(
    channel: 'whatsapp' | 'sms' | 'email',
    recipientCount: number,
): number {
    const costPerRecipient = {
        whatsapp: CREDIT_COSTS.WHATSAPP_PER_MESSAGE,
        sms: CREDIT_COSTS.SMS_PER_MESSAGE,
        email: CREDIT_COSTS.EMAIL_PER_RECIPIENT,
    }[channel]
    return costPerRecipient * recipientCount
}

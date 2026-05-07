import Twilio from 'twilio'

export const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER
export const TWILIO_SMS_NUMBER = process.env.TWILIO_SMS_NUMBER

let twilioClient: ReturnType<typeof Twilio> | null = null

export function getTwilioClient() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
        throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required to send messages with Twilio')
    }

    twilioClient ??= Twilio(accountSid, authToken)
    return twilioClient
}

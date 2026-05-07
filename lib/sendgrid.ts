import sgMail from '@sendgrid/mail'

export const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@bhsolutions.com.br'
export const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'ConvertAI'

let configured = false

export function getSendGridClient() {
    const apiKey = process.env.SENDGRID_API_KEY
    if (!apiKey) {
        throw new Error('SENDGRID_API_KEY is required to send email with SendGrid')
    }

    if (!configured) {
        sgMail.setApiKey(apiKey)
        configured = true
    }

    return sgMail
}

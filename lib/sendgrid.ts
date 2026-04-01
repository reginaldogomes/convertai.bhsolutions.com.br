import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export const sendgrid = sgMail
export const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@bhsolutions.com.br'
export const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'ConvertAI'

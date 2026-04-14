/**
 * Serviços mock para desenvolvimento local.
 * Ativados quando DEV_MOCK_INTEGRATIONS=true no .env.local.
 *
 * Comportamento:
 * - Não fazem chamadas a APIs externas (Twilio, Resend, SendGrid)
 * - Logam no console o que seria enviado
 * - Retornam resultados de sucesso simulados
 * - Economizam créditos de Twilio e de email em dev/testes
 */

import type { IWhatsAppService, SendWhatsAppInput, SendWhatsAppResult } from '@/domain/interfaces/whatsapp-service'
import type { ISmsService, SendSmsInput, SendSmsResult } from '@/domain/interfaces/sms-service'
import type { IEmailService, SendEmailInput, SendBatchEmailInput, SendEmailResult } from '@/domain/interfaces'

function mockSid(): string {
    return `MOCK_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

// ── WhatsApp mock ──────────────────────────────────────────────────────────────

export class MockWhatsAppService implements IWhatsAppService {
    async send(input: SendWhatsAppInput): Promise<SendWhatsAppResult> {
        const sid = mockSid()
        console.info('[MOCK] WhatsApp →', input.to, '|', input.body.slice(0, 80) + (input.body.length > 80 ? '…' : ''), '| sid:', sid)
        return { sid, status: 'sent' }
    }
}

// ── SMS mock ───────────────────────────────────────────────────────────────────

export class MockSmsService implements ISmsService {
    async send(input: SendSmsInput): Promise<SendSmsResult> {
        const sid = mockSid()
        console.info('[MOCK] SMS →', input.to, '|', input.body.slice(0, 80) + (input.body.length > 80 ? '…' : ''), '| sid:', sid)
        return { sid, status: 'sent' }
    }

    async sendBatch(inputs: SendSmsInput[]): Promise<{ sent: number; failed: number }> {
        console.info(`[MOCK] SMS batch → ${inputs.length} mensagens (nenhuma enviada em dev)`)
        inputs.forEach(i => console.info('  ↳', i.to, '|', i.body.slice(0, 60)))
        return { sent: inputs.length, failed: 0 }
    }
}

// ── Email mock ─────────────────────────────────────────────────────────────────

export class MockEmailService implements IEmailService {
    async send(input: SendEmailInput): Promise<SendEmailResult> {
        const id = mockSid()
        console.info('[MOCK] Email →', input.to, '| Assunto:', input.subject, '| id:', id)
        return { id }
    }

    async sendBatch(inputs: SendBatchEmailInput[]): Promise<{ sent: number; failed: number }> {
        console.info(`[MOCK] Email batch → ${inputs.length} emails (nenhum enviado em dev)`)
        inputs.slice(0, 5).forEach(i => console.info('  ↳', i.to, '|', i.subject))
        if (inputs.length > 5) console.info(`  ↳ ... e mais ${inputs.length - 5}`)
        return { sent: inputs.length, failed: 0 }
    }
}

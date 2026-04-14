import { describe, it, expect } from 'vitest'
import { Campaign } from '@/domain/entities/campaign'
import type { CampaignProps } from '@/domain/entities/campaign'

// ─── Factories ────────────────────────────────────────────────────────────────

function makeCampaign(overrides: Partial<CampaignProps> = {}): Campaign {
    return new Campaign({
        id: 'camp-1',
        organizationId: 'org-1',
        name: 'Campanha Teste',
        subject: 'Assunto do email',
        body: '<p>Corpo da mensagem</p>',
        channel: 'email',
        status: 'draft',
        sentAt: null,
        metrics: {
            open_rate: 0,
            click_rate: 0,
            bounce_rate: 0,
            total_sent: 0,
            total_failed: 0,
        },
        createdAt: '2026-01-01T00:00:00.000Z',
        ...overrides,
    })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Campaign entity', () => {
    describe('status helpers', () => {
        it('isDraft() returns true for draft status', () => {
            expect(makeCampaign({ status: 'draft' }).isDraft()).toBe(true)
        })

        it('isDraft() returns false for sent status', () => {
            expect(makeCampaign({ status: 'sent' }).isDraft()).toBe(false)
        })

        it('isSent() returns true for sent status', () => {
            expect(makeCampaign({ status: 'sent' }).isSent()).toBe(true)
        })

        it('isSent() returns false for draft status', () => {
            expect(makeCampaign({ status: 'draft' }).isSent()).toBe(false)
        })
    })

    describe('channel helpers', () => {
        it('isEmail() returns true for email channel', () => {
            expect(makeCampaign({ channel: 'email' }).isEmail()).toBe(true)
        })

        it('isWhatsApp() returns true for whatsapp channel', () => {
            expect(makeCampaign({ channel: 'whatsapp' }).isWhatsApp()).toBe(true)
        })

        it('isSms() returns true for sms channel', () => {
            expect(makeCampaign({ channel: 'sms' }).isSms()).toBe(true)
        })

        it('isEmail() returns false for whatsapp channel', () => {
            expect(makeCampaign({ channel: 'whatsapp' }).isEmail()).toBe(false)
        })

        it.each([
            ['email', 'Email'],
            ['whatsapp', 'WhatsApp'],
            ['sms', 'SMS'],
            ['unknown', 'unknown'],
        ])('channelLabel() for "%s" returns "%s"', (channel, expected) => {
            expect(makeCampaign({ channel }).channelLabel()).toBe(expected)
        })
    })

    describe('canSend()', () => {
        it('email campaign with subject and body can be sent', () => {
            expect(makeCampaign({ channel: 'email', status: 'draft', subject: 'Sub', body: '<p>Body</p>' }).canSend()).toBe(true)
        })

        it('email campaign without subject cannot be sent', () => {
            expect(makeCampaign({ channel: 'email', status: 'draft', subject: '', body: '<p>Body</p>' }).canSend()).toBe(false)
        })

        it('email campaign without body cannot be sent', () => {
            expect(makeCampaign({ channel: 'email', status: 'draft', subject: 'Sub', body: '' }).canSend()).toBe(false)
        })

        it('whatsapp campaign with body can be sent when draft', () => {
            expect(makeCampaign({ channel: 'whatsapp', status: 'draft', body: 'Olá {{nome}}' }).canSend()).toBe(true)
        })

        it('whatsapp campaign without body cannot be sent', () => {
            expect(makeCampaign({ channel: 'whatsapp', status: 'draft', body: '' }).canSend()).toBe(false)
        })

        it('already sent campaign cannot be sent again via canSend()', () => {
            expect(makeCampaign({ status: 'sent', subject: 'Sub', body: '<p>Body</p>' }).canSend()).toBe(false)
        })
    })

    describe('canResend()', () => {
        it('sent email campaign with subject and body can be resent', () => {
            expect(makeCampaign({ status: 'sent', channel: 'email', subject: 'Sub', body: '<p>Body</p>' }).canResend()).toBe(true)
        })

        it('draft campaign cannot be resent', () => {
            expect(makeCampaign({ status: 'draft', subject: 'Sub', body: '<p>Body</p>' }).canResend()).toBe(false)
        })

        it('sent whatsapp campaign with body can be resent', () => {
            expect(makeCampaign({ status: 'sent', channel: 'whatsapp', body: 'Olá' }).canResend()).toBe(true)
        })
    })

    describe('fromRow()', () => {
        it('maps database row to Campaign entity correctly', () => {
            const row = {
                id: 'row-id',
                organization_id: 'row-org',
                name: 'Nome',
                subject: 'Assunto',
                body: 'Corpo',
                channel: 'email',
                status: 'draft' as const,
                sent_at: null,
                metrics_json: null,
                created_at: '2026-01-01T00:00:00Z',
            }
            const c = Campaign.fromRow(row)
            expect(c.id).toBe('row-id')
            expect(c.organizationId).toBe('row-org')
            expect(c.channel).toBe('email')
            expect(c.metrics.total_sent).toBe(0)
        })

        it('parses non-null metrics from row', () => {
            const row = {
                id: 'x',
                organization_id: 'org',
                name: 'N',
                subject: 'S',
                body: 'B',
                channel: 'whatsapp',
                status: 'sent' as const,
                sent_at: '2026-01-01T00:00:00Z',
                metrics: { total_sent: 50, total_failed: 5, open_rate: 0, click_rate: 0, bounce_rate: 0 },
                created_at: '2026-01-01T00:00:00Z',
            }
            const c = Campaign.fromRow(row)
            expect(c.metrics.total_sent).toBe(50)
            expect(c.metrics.total_failed).toBe(5)
        })
    })
})

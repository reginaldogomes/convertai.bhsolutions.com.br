import { describe, it, expect } from 'vitest'
import { Deal } from '@/domain/entities/deal'
import type { DealProps } from '@/domain/entities/deal'
import type { PipelineStage } from '@/types/database'

function makeDeal(overrides: Partial<DealProps> = {}): Deal {
    return new Deal({
        id: 'deal-1',
        organizationId: 'org-1',
        contactId: 'contact-1',
        title: 'Proposta Empresa X',
        pipelineStage: 'contato',
        value: 5000,
        status: 'open',
        assignedTo: null,
        createdAt: '2026-01-01T00:00:00Z',
        ...overrides,
    })
}

describe('Deal entity', () => {
    describe('getters', () => {
        it('exposes all props correctly', () => {
            const d = makeDeal()
            expect(d.id).toBe('deal-1')
            expect(d.organizationId).toBe('org-1')
            expect(d.contactId).toBe('contact-1')
            expect(d.title).toBe('Proposta Empresa X')
            expect(d.value).toBe(5000)
            expect(d.status).toBe('open')
        })
    })

    describe('belongsToOrg()', () => {
        it('returns true for matching org', () => {
            expect(makeDeal({ organizationId: 'org-abc' }).belongsToOrg('org-abc')).toBe(true)
        })

        it('returns false for mismatching org', () => {
            expect(makeDeal({ organizationId: 'org-abc' }).belongsToOrg('org-xyz')).toBe(false)
        })
    })

    describe('isWon()', () => {
        it('returns true for won status', () => {
            expect(makeDeal({ status: 'won' }).isWon()).toBe(true)
        })

        it('returns false for open status', () => {
            expect(makeDeal({ status: 'open' }).isWon()).toBe(false)
        })

        it('returns false for lost status', () => {
            expect(makeDeal({ status: 'lost' }).isWon()).toBe(false)
        })
    })

    describe('stageLabel()', () => {
        it('replaces underscores with spaces', () => {
            expect(makeDeal({ pipelineStage: 'novo_lead' }).stageLabel()).toBe('novo lead')
        })

        it('returns stage as-is when no underscores', () => {
            expect(makeDeal({ pipelineStage: 'contato' }).stageLabel()).toBe('contato')
        })

        it('handles multi-word stage correctly', () => {
            expect(makeDeal({ pipelineStage: 'fechado_ganho' }).stageLabel()).toBe('fechado ganho')
        })
    })

    describe('stageOrder()', () => {
        it('returns all pipeline stages', () => {
            const order = Deal.stageOrder()
            expect(order).toContain('novo_lead')
            expect(order).toContain('fechado_ganho')
            expect(order).toContain('fechado_perdido')
            expect(order.length).toBeGreaterThanOrEqual(5)
        })

        it('has novo_lead as the first stage', () => {
            expect(Deal.stageOrder()[0]).toBe('novo_lead')
        })
    })

    describe('fromRow()', () => {
        it('maps row to Deal entity', () => {
            const row = {
                id: 'row-deal',
                organization_id: 'org-row',
                contact_id: 'contact-row',
                title: 'Negócio Row',
                pipeline_stage: 'proposta' as PipelineStage,
                value: 10000,
                status: 'open' as const,
                assigned_to: null,
                created_at: '2026-01-01T00:00:00Z',
                contacts: null,
            }
            const d = Deal.fromRow(row)
            expect(d.id).toBe('row-deal')
            expect(d.pipelineStage).toBe('proposta')
            expect(d.value).toBe(10000)
        })
    })
})

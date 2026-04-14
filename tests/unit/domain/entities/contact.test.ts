import { describe, it, expect } from 'vitest'
import { Contact } from '@/domain/entities/contact'
import type { ContactProps } from '@/domain/entities/contact'

function makeContact(overrides: Partial<ContactProps> = {}): Contact {
    return new Contact({
        id: 'contact-1',
        organizationId: 'org-1',
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '+5531998811678',
        company: 'Empresa LTDA',
        tags: ['lead', 'vip'],
        notes: 'Anotação do contato',
        createdAt: '2026-01-01T00:00:00Z',
        ...overrides,
    })
}

describe('Contact entity', () => {
    describe('getters', () => {
        it('exposes all props via getters', () => {
            const c = makeContact()
            expect(c.id).toBe('contact-1')
            expect(c.organizationId).toBe('org-1')
            expect(c.name).toBe('João Silva')
            expect(c.email).toBe('joao@example.com')
            expect(c.phone).toBe('+5531998811678')
            expect(c.company).toBe('Empresa LTDA')
            expect(c.tags).toEqual(['lead', 'vip'])
            expect(c.notes).toBe('Anotação do contato')
        })

        it('allows null for optional fields', () => {
            const c = makeContact({ email: null, phone: null, company: null, notes: null })
            expect(c.email).toBeNull()
            expect(c.phone).toBeNull()
            expect(c.company).toBeNull()
            expect(c.notes).toBeNull()
        })
    })

    describe('belongsToOrg()', () => {
        it('returns true when orgId matches', () => {
            expect(makeContact({ organizationId: 'org-abc' }).belongsToOrg('org-abc')).toBe(true)
        })

        it('returns false when orgId does not match', () => {
            expect(makeContact({ organizationId: 'org-abc' }).belongsToOrg('org-xyz')).toBe(false)
        })
    })

    describe('fromRow()', () => {
        it('maps row to Contact entity', () => {
            const row = {
                id: 'row-1',
                organization_id: 'org-row',
                name: 'Maria',
                email: 'maria@test.com',
                phone: null,
                company: null,
                tags: ['ativo'],
                notes: null,
                created_at: '2026-02-01T00:00:00Z',
            }
            const c = Contact.fromRow(row)
            expect(c.id).toBe('row-1')
            expect(c.organizationId).toBe('org-row')
            expect(c.name).toBe('Maria')
            expect(c.tags).toEqual(['ativo'])
        })

        it('defaults tags to empty array when null in row', () => {
            const row = {
                id: 'row-2',
                organization_id: 'org-1',
                name: 'Pedro',
                email: null,
                phone: null,
                company: null,
                tags: null as unknown as string[],
                notes: null,
                created_at: '2026-01-01T00:00:00Z',
            }
            const c = Contact.fromRow(row)
            expect(c.tags).toEqual([])
        })
    })
})

import { describe, it, expect } from 'vitest'
import { Product } from '@/domain/entities/product'
import type { ProductProps } from '@/domain/entities/product'

function makeProduct(overrides: Partial<ProductProps> = {}): Product {
    return new Product({
        id: 'prod-1',
        organizationId: 'org-1',
        name: 'Software CRM',
        slug: 'software-crm',
        type: 'product',
        shortDescription: 'CRM para pequenas empresas',
        fullDescription: 'Descrição completa do CRM',
        price: 99.90,
        priceType: 'monthly',
        currency: 'BRL',
        features: [{ title: 'Automação', description: 'Fluxos automáticos' }],
        benefits: [{ title: 'Produtividade', description: 'Mais foco no que importa' }],
        faqs: [{ question: 'Como funciona?', answer: 'Muito bem.' }],
        targetAudience: 'Pequenas e médias empresas',
        differentials: 'Integração com WhatsApp',
        tags: ['crm', 'saas'],
        images: [],
        status: 'active',
        metadataJson: {},
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        ...overrides,
    })
}

describe('Product entity', () => {
    describe('status helpers', () => {
        it('isDraft() returns true for draft', () => {
            expect(makeProduct({ status: 'draft' }).isDraft()).toBe(true)
        })

        it('isActive() returns true for active', () => {
            expect(makeProduct({ status: 'active' }).isActive()).toBe(true)
        })

        it('isArchived() returns true for archived', () => {
            expect(makeProduct({ status: 'archived' }).isArchived()).toBe(true)
        })

        it('isActive() returns false for draft', () => {
            expect(makeProduct({ status: 'draft' }).isActive()).toBe(false)
        })
    })

    describe('type helpers', () => {
        it('isProduct() returns true for product type', () => {
            expect(makeProduct({ type: 'product' }).isProduct()).toBe(true)
        })

        it('isService() returns true for service type', () => {
            expect(makeProduct({ type: 'service' }).isService()).toBe(true)
        })

        it('isProduct() returns false for service type', () => {
            expect(makeProduct({ type: 'service' }).isProduct()).toBe(false)
        })
    })

    describe('formattedPrice', () => {
        it('returns "Sob consulta" when price is null', () => {
            expect(makeProduct({ price: null }).formattedPrice).toBe('Sob consulta')
        })

        it('formats price in BRL currency', () => {
            const formatted = makeProduct({ price: 99.90, currency: 'BRL' }).formattedPrice
            expect(formatted).toContain('99')
            expect(formatted).toContain('90')
        })

        it('formats zero price', () => {
            const formatted = makeProduct({ price: 0 }).formattedPrice
            expect(formatted).toMatch(/0/)
        })
    })

    describe('getters', () => {
        it('exposes all basic props', () => {
            const p = makeProduct()
            expect(p.id).toBe('prod-1')
            expect(p.organizationId).toBe('org-1')
            expect(p.name).toBe('Software CRM')
            expect(p.slug).toBe('software-crm')
            expect(p.features).toHaveLength(1)
            expect(p.faqs).toHaveLength(1)
        })
    })
})

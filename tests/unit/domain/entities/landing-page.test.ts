import { describe, it, expect } from 'vitest'
import { LandingPage } from '@/domain/entities/landing-page'
import type { LandingPageProps } from '@/domain/entities/landing-page'

function makeLandingPage(overrides: Partial<LandingPageProps> = {}): LandingPage {
    return new LandingPage({
        id: 'lp-1',
        organizationId: 'org-1',
        productId: null,
        name: 'Página de Captação',
        slug: 'pagina-captacao',
        headline: 'Transforme leads em clientes',
        subheadline: 'Com a melhor plataforma do mercado',
        ctaText: 'Quero começar',
        configJson: {
            theme: 'dark',
            primaryColor: '#6366f1',
            logoUrl: null,
            sections: [],
        },
        chatbotName: 'Assistente',
        chatbotWelcomeMessage: 'Olá! Como posso ajudar?',
        chatbotSystemPrompt: 'Você é um assistente de vendas.',
        status: 'draft',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        ...overrides,
    })
}

describe('LandingPage entity', () => {
    describe('status helpers', () => {
        it('isDraft() returns true for draft', () => {
            expect(makeLandingPage({ status: 'draft' }).isDraft()).toBe(true)
        })

        it('isPublished() returns true for published', () => {
            expect(makeLandingPage({ status: 'published' }).isPublished()).toBe(true)
        })

        it('isArchived() returns true for archived', () => {
            expect(makeLandingPage({ status: 'archived' }).isArchived()).toBe(true)
        })

        it('isDraft() returns false for published', () => {
            expect(makeLandingPage({ status: 'published' }).isDraft()).toBe(false)
        })

        it('isPublished() returns false for draft', () => {
            expect(makeLandingPage({ status: 'draft' }).isPublished()).toBe(false)
        })
    })

    describe('getters', () => {
        it('exposes all props', () => {
            const lp = makeLandingPage()
            expect(lp.id).toBe('lp-1')
            expect(lp.organizationId).toBe('org-1')
            expect(lp.slug).toBe('pagina-captacao')
            expect(lp.headline).toBe('Transforme leads em clientes')
            expect(lp.ctaText).toBe('Quero começar')
            expect(lp.configJson.theme).toBe('dark')
        })
    })

    describe('fromRow()', () => {
        it('maps row to LandingPage entity', () => {
            const row = {
                id: 'row-lp',
                organization_id: 'org-row',
                product_id: null,
                name: 'Página Row',
                slug: 'pagina-row',
                headline: 'Headline',
                subheadline: 'Sub',
                cta_text: 'CTA',
                config_json: null,
                chatbot_name: 'Bot',
                chatbot_welcome_message: 'Olá',
                chatbot_system_prompt: 'Prompt',
                status: 'published' as const,
                created_at: '2026-01-01T00:00:00Z',
                updated_at: '2026-01-02T00:00:00Z',
            }
            const lp = LandingPage.fromRow(row)
            expect(lp.id).toBe('row-lp')
            expect(lp.organizationId).toBe('org-row')
            expect(lp.isPublished()).toBe(true)
            expect(lp.configJson.theme).toBeDefined()
        })
    })
})

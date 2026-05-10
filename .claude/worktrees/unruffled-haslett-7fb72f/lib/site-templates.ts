import type { SiteConfig } from '@/types/site-config'
import type { LandingPageSection } from '@/domain/entities'

// ─── Template types ───────────────────────────────────────────────────────────

export interface SiteTemplate {
    id: string
    name: string
    description: string
    category: 'business' | 'portfolio' | 'saas' | 'ecommerce' | 'agency' | 'blog'
    previewColor: string
    /** Partial SiteConfig applied when creating from this template */
    config: Partial<SiteConfig>
    /** Default pages (name + section skeleton) */
    pages: SiteTemplatePage[]
}

export interface SiteTemplatePage {
    name: string
    navLabel: string
    isHomepage: boolean
    sections: Partial<LandingPageSection>[]
}

// ─── Templates ────────────────────────────────────────────────────────────────

export const SITE_TEMPLATES: SiteTemplate[] = [
    // ── 1. Tech SaaS ─────────────────────────────────────────────────────────
    {
        id: 'tech-saas',
        name: 'Tech SaaS',
        description: 'Produto digital, captação de leads e freemium. Header transparente sobre hero, rodapé com colunas.',
        category: 'saas',
        previewColor: '#6366f1',
        config: {
            theme: 'dark',
            primaryColor: '#6366f1',
            nav: { style: 'transparent', ctaText: 'Começar grátis', ctaUrl: '#planos', showCta: true },
            footer: {
                style: 'columns',
                tagline: 'Automatize seu crescimento com inteligência.',
                socialLinks: [
                    { platform: 'linkedin', url: '#' },
                    { platform: 'instagram', url: '#' },
                ],
                linkGroups: [
                    { title: 'Produto', links: [{ label: 'Features', url: '#features' }, { label: 'Planos', url: '#planos' }, { label: 'Changelog', url: '/changelog' }] },
                    { title: 'Empresa', links: [{ label: 'Sobre', url: '/sobre' }, { label: 'Blog', url: '/blog' }, { label: 'Contato', url: '/contato' }] },
                ],
                copyright: '',
                showNewsletter: true,
            },
        },
        pages: [
            {
                name: 'Início',
                navLabel: 'Início',
                isHomepage: true,
                sections: [
                    { type: 'hero', order: 0 },
                    { type: 'logo_cloud', order: 1 },
                    { type: 'features', order: 2 },
                    { type: 'benefits_grid', order: 3 },
                    { type: 'testimonials', order: 4 },
                    { type: 'pricing', order: 5 },
                    { type: 'faq', order: 6 },
                    { type: 'cta_banner', order: 7 },
                ],
            },
            { name: 'Sobre', navLabel: 'Sobre', isHomepage: false, sections: [{ type: 'about_expert', order: 0 }, { type: 'stats', order: 1 }, { type: 'cta_banner', order: 2 }] },
            { name: 'Contato', navLabel: 'Contato', isHomepage: false, sections: [{ type: 'contact_form', order: 0 }] },
        ],
    },

    // ── 2. Consultoria / Serviços ─────────────────────────────────────────────
    {
        id: 'consultoria',
        name: 'Consultoria',
        description: 'Prestadores de serviço, consultores e coaches. Visual clean, autoridade e conversão.',
        category: 'business',
        previewColor: '#0f766e',
        config: {
            theme: 'light',
            primaryColor: '#0f766e',
            nav: { style: 'solid', ctaText: 'Agendar conversa', ctaUrl: '#contato', showCta: true },
            footer: {
                style: 'columns',
                tagline: 'Transformando negócios com estratégia e experiência.',
                socialLinks: [{ platform: 'linkedin', url: '#' }, { platform: 'instagram', url: '#' }],
                linkGroups: [
                    { title: 'Serviços', links: [{ label: 'Consultoria', url: '#servicos' }, { label: 'Treinamentos', url: '#' }, { label: 'Mentorias', url: '#' }] },
                    { title: 'Empresa', links: [{ label: 'Sobre', url: '/sobre' }, { label: 'Cases', url: '/cases' }, { label: 'Contato', url: '/contato' }] },
                ],
                copyright: '',
                showNewsletter: false,
            },
        },
        pages: [
            {
                name: 'Início', navLabel: 'Início', isHomepage: true,
                sections: [
                    { type: 'hero', order: 0 },
                    { type: 'stats', order: 1 },
                    { type: 'features', order: 2 },
                    { type: 'process_steps', order: 3 },
                    { type: 'testimonials', order: 4 },
                    { type: 'about_expert', order: 5 },
                    { type: 'cta_banner', order: 6 },
                ],
            },
            { name: 'Sobre', navLabel: 'Sobre', isHomepage: false, sections: [{ type: 'about_expert', order: 0 }, { type: 'stats', order: 1 }] },
            { name: 'Cases', navLabel: 'Cases', isHomepage: false, sections: [{ type: 'testimonials', order: 0 }, { type: 'gallery', order: 1 }] },
            { name: 'Contato', navLabel: 'Contato', isHomepage: false, sections: [{ type: 'contact_form', order: 0 }] },
        ],
    },

    // ── 3. Agência / Criativa ──────────────────────────────────────────────────
    {
        id: 'agencia',
        name: 'Agência Criativa',
        description: 'Portfólio visual, projetos e equipe. Header frosted sobre hero impactante.',
        category: 'agency',
        previewColor: '#ec4899',
        config: {
            theme: 'dark',
            primaryColor: '#ec4899',
            nav: { style: 'frosted', ctaText: 'Solicitar proposta', ctaUrl: '#contato', showCta: true },
            footer: {
                style: 'centered',
                tagline: 'Criatividade que converte.',
                socialLinks: [
                    { platform: 'instagram', url: '#' },
                    { platform: 'linkedin', url: '#' },
                    { platform: 'youtube', url: '#' },
                ],
                linkGroups: [],
                copyright: '',
                showNewsletter: false,
            },
        },
        pages: [
            {
                name: 'Início', navLabel: 'Início', isHomepage: true,
                sections: [
                    { type: 'hero', order: 0 },
                    { type: 'logo_cloud', order: 1 },
                    { type: 'gallery', order: 2 },
                    { type: 'features', order: 3 },
                    { type: 'testimonials', order: 4 },
                    { type: 'cta_banner', order: 5 },
                ],
            },
            { name: 'Portfólio', navLabel: 'Portfólio', isHomepage: false, sections: [{ type: 'gallery', order: 0 }] },
            { name: 'Equipe', navLabel: 'Equipe', isHomepage: false, sections: [{ type: 'about_expert', order: 0 }] },
            { name: 'Contato', navLabel: 'Contato', isHomepage: false, sections: [{ type: 'contact_form', order: 0 }] },
        ],
    },

    // ── 4. E-commerce / Produto ─────────────────────────────────────────────
    {
        id: 'produto',
        name: 'Produto / Loja',
        description: 'Landing de produto físico ou digital com foco em conversão e prova social.',
        category: 'ecommerce',
        previewColor: '#f59e0b',
        config: {
            theme: 'light',
            primaryColor: '#f59e0b',
            nav: { style: 'solid', ctaText: 'Comprar agora', ctaUrl: '#produto', showCta: true },
            footer: {
                style: 'minimal',
                tagline: '',
                socialLinks: [{ platform: 'instagram', url: '#' }, { platform: 'whatsapp', url: '#' }],
                linkGroups: [],
                copyright: '',
                showNewsletter: false,
            },
        },
        pages: [
            {
                name: 'Início', navLabel: 'Início', isHomepage: true,
                sections: [
                    { type: 'hero', order: 0 },
                    { type: 'benefits_grid', order: 1 },
                    { type: 'stats', order: 2 },
                    { type: 'testimonials', order: 3 },
                    { type: 'pricing', order: 4 },
                    { type: 'faq', order: 5 },
                    { type: 'cta_banner', order: 6 },
                ],
            },
            { name: 'FAQ', navLabel: 'FAQ', isHomepage: false, sections: [{ type: 'faq', order: 0 }] },
            { name: 'Contato', navLabel: 'Contato', isHomepage: false, sections: [{ type: 'contact_form', order: 0 }] },
        ],
    },

    // ── 5. Portfólio Pessoal ─────────────────────────────────────────────────
    {
        id: 'portfolio',
        name: 'Portfólio Pessoal',
        description: 'Freelancer, designer ou dev. Minimalista, elegante e focado no trabalho.',
        category: 'portfolio',
        previewColor: '#334155',
        config: {
            theme: 'light',
            primaryColor: '#334155',
            nav: { style: 'frosted', ctaText: 'Contratar', ctaUrl: '#contato', showCta: true },
            footer: {
                style: 'centered',
                tagline: 'Feito com atenção aos detalhes.',
                socialLinks: [
                    { platform: 'linkedin', url: '#' },
                    { platform: 'instagram', url: '#' },
                    { platform: 'twitter', url: '#' },
                ],
                linkGroups: [],
                copyright: '',
                showNewsletter: false,
            },
        },
        pages: [
            {
                name: 'Início', navLabel: 'Início', isHomepage: true,
                sections: [
                    { type: 'hero', order: 0 },
                    { type: 'about_expert', order: 1 },
                    { type: 'gallery', order: 2 },
                    { type: 'testimonials', order: 3 },
                    { type: 'contact_form', order: 4 },
                ],
            },
            { name: 'Trabalhos', navLabel: 'Trabalhos', isHomepage: false, sections: [{ type: 'gallery', order: 0 }] },
            { name: 'Sobre', navLabel: 'Sobre', isHomepage: false, sections: [{ type: 'about_expert', order: 0 }] },
        ],
    },

    // ── 6. Institucional ─────────────────────────────────────────────────────
    {
        id: 'institucional',
        name: 'Institucional',
        description: 'Empresa estabelecida com múltiplas páginas: home, sobre, serviços, contato.',
        category: 'business',
        previewColor: '#1e40af',
        config: {
            theme: 'light',
            primaryColor: '#1e40af',
            nav: { style: 'solid', ctaText: 'Entre em contato', ctaUrl: '/contato', showCta: true },
            footer: {
                style: 'columns',
                tagline: 'Excelência que você pode confiar.',
                socialLinks: [{ platform: 'linkedin', url: '#' }, { platform: 'instagram', url: '#' }, { platform: 'facebook', url: '#' }],
                linkGroups: [
                    { title: 'Empresa', links: [{ label: 'Sobre nós', url: '/sobre' }, { label: 'Equipe', url: '/sobre#equipe' }, { label: 'Carreiras', url: '#' }] },
                    { title: 'Serviços', links: [{ label: 'Soluções', url: '/servicos' }, { label: 'Cases', url: '/cases' }] },
                    { title: 'Suporte', links: [{ label: 'Contato', url: '/contato' }, { label: 'FAQ', url: '/faq' }] },
                ],
                copyright: '',
                showNewsletter: false,
            },
        },
        pages: [
            {
                name: 'Início', navLabel: 'Início', isHomepage: true,
                sections: [
                    { type: 'hero', order: 0 },
                    { type: 'logo_cloud', order: 1 },
                    { type: 'features', order: 2 },
                    { type: 'stats', order: 3 },
                    { type: 'testimonials', order: 4 },
                    { type: 'cta_banner', order: 5 },
                ],
            },
            { name: 'Sobre', navLabel: 'Sobre', isHomepage: false, sections: [{ type: 'about_expert', order: 0 }, { type: 'stats', order: 1 }] },
            { name: 'Serviços', navLabel: 'Serviços', isHomepage: false, sections: [{ type: 'features', order: 0 }, { type: 'process_steps', order: 1 }, { type: 'pricing', order: 2 }] },
            { name: 'FAQ', navLabel: 'FAQ', isHomepage: false, sections: [{ type: 'faq', order: 0 }] },
            { name: 'Contato', navLabel: 'Contato', isHomepage: false, sections: [{ type: 'contact_form', order: 0 }] },
        ],
    },
]

export function getTemplateById(id: string): SiteTemplate | undefined {
    return SITE_TEMPLATES.find(t => t.id === id)
}

export const TEMPLATE_CATEGORIES = [
    { id: 'all', label: 'Todos' },
    { id: 'saas', label: 'SaaS' },
    { id: 'business', label: 'Negócios' },
    { id: 'agency', label: 'Agência' },
    { id: 'portfolio', label: 'Portfólio' },
    { id: 'ecommerce', label: 'Produto' },
] as const

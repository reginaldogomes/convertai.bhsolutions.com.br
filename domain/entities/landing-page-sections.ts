// ============================================================
// Landing Page Section Types
// ============================================================

export type SectionType =
    | 'hero'
    | 'features'
    | 'benefits_grid'
    | 'process_steps'
    | 'testimonials'
    | 'faq'
    | 'pricing'
    | 'contact_form'
    | 'cta_banner'
    | 'video'
    | 'stats'
    | 'logo_cloud'
    | 'gallery'

// --- Content types per section ---

export interface HeroContent {
    kicker: string
    headline: string
    subheadline: string
    ctaText: string
    ctaUrl: string
    backgroundImageUrl: string | null
    heroImageUrl: string | null
    trustBadges: string[]
    alignment: 'center' | 'left'
}

export interface FeatureItem {
    icon: string
    title: string
    description: string
}

export interface FeaturesContent {
    title: string
    subtitle: string
    columns: 2 | 3 | 4
    items: FeatureItem[]
}

export interface BenefitsGridContent {
    title: string
    subtitle: string
    items: Array<{ title: string; description: string }>
}

export interface ProcessStepsContent {
    title: string
    subtitle: string
    steps: Array<{ title: string; description: string }>
}

export interface TestimonialItem {
    name: string
    role: string
    company: string
    avatarUrl: string | null
    quote: string
    rating: number
}

export interface TestimonialsContent {
    title: string
    items: TestimonialItem[]
}

export interface FaqItem {
    question: string
    answer: string
}

export interface FaqContent {
    title: string
    subtitle: string
    items: FaqItem[]
}

export interface PricingTier {
    name: string
    price: string
    period: string
    description: string
    features: string[]
    ctaText: string
    highlighted: boolean
}

export interface PricingContent {
    title: string
    subtitle: string
    tiers: PricingTier[]
}

export interface ContactFormContent {
    title: string
    subtitle: string
    fields: Array<'name' | 'email' | 'phone' | 'company' | 'message'>
    submitText: string
    successMessage: string
}

export interface CtaBannerContent {
    title: string
    subtitle: string
    ctaText: string
    ctaUrl: string
}

export interface VideoContent {
    title: string
    videoUrl: string
    provider: 'youtube' | 'vimeo'
}

export interface StatItem {
    value: string
    label: string
}

export interface StatsContent {
    title: string
    items: StatItem[]
}

export interface LogoCloudContent {
    title: string
    logos: Array<{ name: string; imageUrl: string }>
}

export interface GalleryContent {
    title: string
    images: Array<{ url: string; alt: string }>
    columns: 2 | 3 | 4
}

// --- Union of all content types ---

export type SectionContentMap = {
    hero: HeroContent
    features: FeaturesContent
    benefits_grid: BenefitsGridContent
    process_steps: ProcessStepsContent
    testimonials: TestimonialsContent
    faq: FaqContent
    pricing: PricingContent
    contact_form: ContactFormContent
    cta_banner: CtaBannerContent
    video: VideoContent
    stats: StatsContent
    logo_cloud: LogoCloudContent
    gallery: GalleryContent
}

export type SectionContent = SectionContentMap[SectionType]

export interface LandingPageSection<T extends SectionType = SectionType> {
    id: string
    type: T
    order: number
    visible: boolean
    content: SectionContentMap[T]
}

// --- Default content factories ---

export const DEFAULT_SECTION_CONTENT: { [K in SectionType]: SectionContentMap[K] } = {
    hero: {
        kicker: 'Oferta especial por tempo limitado',
        headline: 'Transforme seu negócio',
        subheadline: 'Soluções inovadoras para sua empresa crescer.',
        ctaText: 'Fale conosco',
        ctaUrl: '#',
        backgroundImageUrl: null,
        heroImageUrl: null,
        trustBadges: ['Sem compromisso', 'Suporte especializado', 'Resultados mensuráveis'],
        alignment: 'center',
    },
    features: {
        title: 'Nossos Diferenciais',
        subtitle: 'Tudo que você precisa em um só lugar.',
        columns: 3,
        items: [
            { icon: 'Zap', title: 'Rápido', description: 'Resultados em tempo real.' },
            { icon: 'Shield', title: 'Seguro', description: 'Dados protegidos.' },
            { icon: 'HeadphonesIcon', title: 'Suporte', description: 'Atendimento 24/7.' },
        ],
    },
    benefits_grid: {
        title: 'Resultados que você vai sentir na prática',
        subtitle: 'Mais do que recursos: ganhos reais para seu dia a dia.',
        items: [
            { title: 'Mais velocidade', description: 'Reduza o tempo operacional e avance mais rápido com menos esforço manual.' },
            { title: 'Mais previsibilidade', description: 'Tenha clareza de próximos passos com dados organizados e acompanhamento contínuo.' },
            { title: 'Mais conversão', description: 'Melhore a experiência do cliente e aumente as oportunidades de fechamento.' },
        ],
    },
    process_steps: {
        title: 'Como funciona',
        subtitle: 'Implementação simples, guiada e orientada para resultado.',
        steps: [
            { title: 'Diagnóstico inicial', description: 'Entendemos seu cenário atual, objetivos e pontos críticos.' },
            { title: 'Configuração estratégica', description: 'Parametrizamos a solução para o seu contexto e metas de negócio.' },
            { title: 'Otimização contínua', description: 'Acompanhamos performance e evoluímos com base em dados reais.' },
        ],
    },
    testimonials: {
        title: 'O que nossos clientes dizem',
        items: [
            { name: 'Maria Silva', role: 'CEO', company: 'Empresa X', avatarUrl: null, quote: 'Excelente plataforma!', rating: 5 },
        ],
    },
    faq: {
        title: 'Perguntas Frequentes',
        subtitle: 'Tire suas dúvidas.',
        items: [
            { question: 'Como funciona?', answer: 'Nosso sistema é simples e intuitivo.' },
            { question: 'Qual o preço?', answer: 'Temos planos a partir de R$ 99/mês.' },
        ],
    },
    pricing: {
        title: 'Planos e Preços',
        subtitle: 'Escolha o plano ideal para você.',
        tiers: [
            { name: 'Básico', price: 'R$ 99', period: '/mês', description: 'Para começar', features: ['1 usuário', 'Suporte email'], ctaText: 'Começar', highlighted: false },
            { name: 'Pro', price: 'R$ 199', period: '/mês', description: 'Para crescer', features: ['5 usuários', 'Suporte prioritário', 'API'], ctaText: 'Escolher Pro', highlighted: true },
            { name: 'Enterprise', price: 'Sob consulta', period: '', description: 'Para grandes empresas', features: ['Ilimitado', 'SLA dedicado', 'Customização'], ctaText: 'Contato', highlighted: false },
        ],
    },
    contact_form: {
        title: 'Entre em contato',
        subtitle: 'Preencha o formulário e retornaremos em breve.',
        fields: ['name', 'email', 'phone', 'company', 'message'],
        submitText: 'Enviar',
        successMessage: 'Mensagem enviada com sucesso!',
    },
    cta_banner: {
        title: 'Pronto para começar?',
        subtitle: 'Crie sua conta gratuitamente e comece agora.',
        ctaText: 'Começar Grátis',
        ctaUrl: '#',
    },
    video: {
        title: 'Veja como funciona',
        videoUrl: '',
        provider: 'youtube',
    },
    stats: {
        title: 'Nossos Números',
        items: [
            { value: '500+', label: 'Clientes' },
            { value: '10k+', label: 'Mensagens/mês' },
            { value: '99.9%', label: 'Uptime' },
            { value: '24/7', label: 'Suporte' },
        ],
    },
    logo_cloud: {
        title: 'Empresas que confiam em nós',
        logos: [],
    },
    gallery: {
        title: 'Galeria',
        images: [],
        columns: 3,
    },
}

export const SECTION_LABELS: Record<SectionType, string> = {
    hero: 'Hero (Banner Principal)',
    features: 'Funcionalidades',
    benefits_grid: 'Grade de Benefícios',
    process_steps: 'Passo a Passo',
    testimonials: 'Depoimentos',
    faq: 'FAQ (Perguntas Frequentes)',
    pricing: 'Tabela de Preços',
    contact_form: 'Formulário de Contato',
    cta_banner: 'Banner CTA',
    video: 'Vídeo',
    stats: 'Estatísticas / Números',
    logo_cloud: 'Logos de Parceiros',
    gallery: 'Galeria de Imagens',
}

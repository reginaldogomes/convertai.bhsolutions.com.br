import { DEFAULT_SECTION_CONTENT, type SectionType } from '@/domain/entities'
import type { GeneratedSection, LandingPageGenerationInput } from './types'
import { availableSectionTypes } from './schemas'
import { asRecord, asString, asNullableString, asBoolean, normalizeColumns, normalizeRating } from './utils'

export function normalizeSections(sections: Array<{ type: typeof availableSectionTypes[number]; content: Record<string, unknown> }>): GeneratedSection[] {
    const normalized = sections.map((section) => ({
        type: section.type,
        content: normalizeSectionContent(section.type, section.content),
    }))

    const hasHero = normalized.some((section) => section.type === 'hero')
    if (!hasHero) {
        normalized.unshift({ type: 'hero', content: DEFAULT_SECTION_CONTENT.hero })
    }

    if (normalized[0]?.type !== 'hero') {
        const heroIndex = normalized.findIndex((section) => section.type === 'hero')
        if (heroIndex > 0) {
            const [hero] = normalized.splice(heroIndex, 1)
            normalized.unshift(hero)
        }
    }

    const lastType = normalized[normalized.length - 1]?.type
    if (lastType !== 'contact_form' && lastType !== 'cta_banner') {
        normalized.push({ type: 'cta_banner', content: DEFAULT_SECTION_CONTENT.cta_banner })
    }

    const conversionOrder: Record<SectionType, number> = {
        hero: 0,
        logo_cloud: 1,
        stats: 2,
        features: 3,
        benefits_grid: 4,
        process_steps: 5,
        about_expert: 6,
        pricing: 7,
        gallery: 8,
        video: 9,
        testimonials: 10,
        faq: 11,
        cta_banner: 12,
        contact_form: 13,
    }

    // Keep a conversion-friendly progression even if AI returns mixed ordering.
    normalized.sort((a, b) => {
        const aRank = conversionOrder[a.type]
        const bRank = conversionOrder[b.type]
        if (aRank !== bRank) return aRank - bRank
        return 0
    })

    if (normalized[0]?.type !== 'hero') {
        const heroIndex = normalized.findIndex((section) => section.type === 'hero')
        if (heroIndex > 0) {
            const [hero] = normalized.splice(heroIndex, 1)
            normalized.unshift(hero)
        }
    }

    return normalized.slice(0, 10)
}

export function normalizeSectionContent(type: SectionType, content: Record<string, unknown>) {
    switch (type) {
        case 'hero': {
            const trustBadges = Array.isArray(content.trustBadges)
                ? content.trustBadges.map((item) => asString(item, '')).filter(Boolean).slice(0, 6)
                : []

            return {
                kicker: asString(content.kicker, DEFAULT_SECTION_CONTENT.hero.kicker),
                headline: asString(content.headline, DEFAULT_SECTION_CONTENT.hero.headline),
                subheadline: asString(content.subheadline, DEFAULT_SECTION_CONTENT.hero.subheadline),
                ctaText: asString(content.ctaText, DEFAULT_SECTION_CONTENT.hero.ctaText),
                ctaUrl: asString(content.ctaUrl, DEFAULT_SECTION_CONTENT.hero.ctaUrl),
                backgroundImageUrl: asNullableString(content.backgroundImageUrl, DEFAULT_SECTION_CONTENT.hero.backgroundImageUrl),
                heroImageUrl: asNullableString(content.heroImageUrl, DEFAULT_SECTION_CONTENT.hero.heroImageUrl),
                layout: content.layout === 'background' ? 'background' : 'split',
                trustBadges: trustBadges.length > 0 ? trustBadges : DEFAULT_SECTION_CONTENT.hero.trustBadges,
                alignment: content.alignment === 'left' ? 'left' : 'center',
            }
        }
        case 'features': {
            const itemsRaw = Array.isArray(content.items) ? content.items : []
            const items = itemsRaw
                .map((item): { icon: string; title: string; description: string } => {
                    const obj = asRecord(item)
                    return {
                        icon: asString(obj.icon, 'Zap'),
                        title: asString(obj.title, 'Diferencial'),
                        description: asString(obj.description, 'Descrição do diferencial.'),
                    }
                })
                .slice(0, 6)

            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.features.title),
                subtitle: asString(content.subtitle, DEFAULT_SECTION_CONTENT.features.subtitle),
                columns: normalizeColumns(content.columns),
                items: items.length >= 2 ? items : DEFAULT_SECTION_CONTENT.features.items,
            }
        }
        case 'benefits_grid': {
            const itemsRaw = Array.isArray(content.items) ? content.items : []
            const items = itemsRaw
                .map((item) => {
                    const obj = asRecord(item)
                    return {
                        title: asString(obj.title, 'Benefício principal'),
                        description: asString(obj.description, 'Descrição do benefício.'),
                    }
                })
                .slice(0, 6)

            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.benefits_grid.title),
                subtitle: asString(content.subtitle, DEFAULT_SECTION_CONTENT.benefits_grid.subtitle),
                items: items.length >= 3 ? items : DEFAULT_SECTION_CONTENT.benefits_grid.items,
            }
        }
        case 'process_steps': {
            const stepsRaw = Array.isArray(content.steps) ? content.steps : []
            const steps = stepsRaw
                .map((step) => {
                    const obj = asRecord(step)
                    return {
                        title: asString(obj.title, 'Etapa'),
                        description: asString(obj.description, 'Descrição da etapa.'),
                    }
                })
                .slice(0, 5)

            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.process_steps.title),
                subtitle: asString(content.subtitle, DEFAULT_SECTION_CONTENT.process_steps.subtitle),
                steps: steps.length >= 3 ? steps : DEFAULT_SECTION_CONTENT.process_steps.steps,
            }
        }
        case 'testimonials': {
            const itemsRaw = Array.isArray(content.items) ? content.items : []
            const items = itemsRaw
                .map((item) => {
                    const obj = asRecord(item)
                    return {
                        name: asString(obj.name, 'Cliente Satisfeito'),
                        role: asString(obj.role, 'Cliente'),
                        company: asString(obj.company, 'Empresa'),
                        avatarUrl: asNullableString(obj.avatarUrl, null),
                        quote: asString(obj.quote, 'Excelente experiência.'),
                        rating: normalizeRating(obj.rating),
                    }
                })
                .slice(0, 6)

            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.testimonials.title),
                items: items.length > 0 ? items : DEFAULT_SECTION_CONTENT.testimonials.items,
            }
        }
        case 'faq': {
            const itemsRaw = Array.isArray(content.items) ? content.items : []
            const items = itemsRaw
                .map((item) => {
                    const obj = asRecord(item)
                    return {
                        question: asString(obj.question, 'Pergunta frequente'),
                        answer: asString(obj.answer, 'Resposta da pergunta frequente.'),
                    }
                })
                .slice(0, 8)

            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.faq.title),
                subtitle: asString(content.subtitle, DEFAULT_SECTION_CONTENT.faq.subtitle),
                items: items.length >= 2 ? items : DEFAULT_SECTION_CONTENT.faq.items,
            }
        }
        case 'pricing': {
            const tiersRaw = Array.isArray(content.tiers) ? content.tiers : []
            const tiers = tiersRaw
                .map((tier) => {
                    const obj = asRecord(tier)
                    const features = Array.isArray(obj.features)
                        ? obj.features.map((feature) => asString(feature, '')).filter(Boolean).slice(0, 8)
                        : []

                    return {
                        name: asString(obj.name, 'Plano'),
                        price: asString(obj.price, 'R$ 0'),
                        period: asString(obj.period, '/mês'),
                        description: asString(obj.description, 'Descrição do plano'),
                        features: features.length > 0 ? features : ['Benefício principal'],
                        ctaText: asString(obj.ctaText, 'Escolher plano'),
                        highlighted: asBoolean(obj.highlighted, false),
                    }
                })
                .slice(0, 4)

            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.pricing.title),
                subtitle: asString(content.subtitle, DEFAULT_SECTION_CONTENT.pricing.subtitle),
                tiers: tiers.length > 0 ? tiers : DEFAULT_SECTION_CONTENT.pricing.tiers,
            }
        }
        case 'contact_form': {
            const fieldsRaw = Array.isArray(content.fields) ? content.fields : []
            const allowedFields = ['name', 'email', 'phone', 'company', 'message'] as const
            const fields = fieldsRaw
                .map((field) => asString(field, '').toLowerCase())
                .filter((field): field is typeof allowedFields[number] => allowedFields.includes(field as typeof allowedFields[number]))

            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.contact_form.title),
                subtitle: asString(content.subtitle, DEFAULT_SECTION_CONTENT.contact_form.subtitle),
                fields: fields.length > 0 ? fields : DEFAULT_SECTION_CONTENT.contact_form.fields,
                submitText: asString(content.submitText, DEFAULT_SECTION_CONTENT.contact_form.submitText),
                successMessage: asString(content.successMessage, DEFAULT_SECTION_CONTENT.contact_form.successMessage),
            }
        }
        case 'cta_banner':
            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.cta_banner.title),
                subtitle: asString(content.subtitle, DEFAULT_SECTION_CONTENT.cta_banner.subtitle),
                ctaText: asString(content.ctaText, DEFAULT_SECTION_CONTENT.cta_banner.ctaText),
                ctaUrl: asString(content.ctaUrl, DEFAULT_SECTION_CONTENT.cta_banner.ctaUrl),
            }
        case 'video':
            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.video.title),
                videoUrl: asString(content.videoUrl, DEFAULT_SECTION_CONTENT.video.videoUrl),
                provider: content.provider === 'vimeo' ? 'vimeo' : 'youtube',
            }
        case 'stats': {
            const itemsRaw = Array.isArray(content.items) ? content.items : []
            const items = itemsRaw
                .map((item) => {
                    const obj = asRecord(item)
                    return {
                        value: asString(obj.value, '0'),
                        label: asString(obj.label, 'Métrica'),
                    }
                })
                .slice(0, 6)

            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.stats.title),
                items: items.length >= 2 ? items : DEFAULT_SECTION_CONTENT.stats.items,
            }
        }
        case 'logo_cloud': {
            const logosRaw = Array.isArray(content.logos) ? content.logos : []
            const logos = logosRaw
                .map((item) => {
                    const obj = asRecord(item)
                    return {
                        name: asString(obj.name, 'Marca parceira'),
                        imageUrl: asString(obj.imageUrl, ''),
                    }
                })
                .filter((logo) => logo.imageUrl.length > 0)
                .slice(0, 8)

            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.logo_cloud.title),
                logos,
            }
        }
        case 'gallery': {
            const imagesRaw = Array.isArray(content.images) ? content.images : []
            const images = imagesRaw
                .map((item) => {
                    const obj = asRecord(item)
                    return {
                        url: asString(obj.url, ''),
                        alt: asString(obj.alt, 'Imagem de destaque'),
                    }
                })
                .filter((img) => img.url.length > 0)
                .slice(0, 8)

            return {
                title: asString(content.title, DEFAULT_SECTION_CONTENT.gallery.title),
                images,
                columns: normalizeColumns(content.columns),
            }
        }
        default:
            return DEFAULT_SECTION_CONTENT.hero
    }
}

export function buildSafeFallbackSections(input: LandingPageGenerationInput): Array<{ type: typeof availableSectionTypes[number]; content: Record<string, unknown> }> {
    const pageName = input.pageContext?.name?.trim()
    const headline = input.pageContext?.headline?.trim()
    const subheadline = input.pageContext?.subheadline?.trim()

    const fallbackHeadline = headline || (pageName ? `Conheça ${pageName}` : 'Transforme seu negócio com uma solução completa')
    const fallbackSubheadline = subheadline || input.prompt.slice(0, 180)

    return [
        {
            type: 'hero',
            content: {
                ...DEFAULT_SECTION_CONTENT.hero,
                headline: fallbackHeadline,
                subheadline: fallbackSubheadline,
                ctaText: 'Quero falar com especialista',
                ctaUrl: '#contato',
                layout: 'split',
            },
        },
        {
            type: 'benefits_grid',
            content: {
                ...DEFAULT_SECTION_CONTENT.benefits_grid,
                title: 'Beneficios principais da nossa solucao',
            },
        },
        {
            type: 'faq',
            content: {
                ...DEFAULT_SECTION_CONTENT.faq,
            },
        },
        {
            type: 'contact_form',
            content: {
                ...DEFAULT_SECTION_CONTENT.contact_form,
            },
        },
    ]
}

import type { LandingPageSection } from '@/domain/entities'
import type { Product } from '@/domain/entities/product'

export function applyHeroPreset(sections: LandingPageSection[], preset: string): LandingPageSection[] {
    const presets: Record<string, { layout: 'background' | 'split'; alignment: 'center' | 'left' }> = {
        central:   { layout: 'background', alignment: 'center' },
        split:     { layout: 'split',      alignment: 'left'   },
        immersive: { layout: 'background', alignment: 'center' },
        minimal:   { layout: 'background', alignment: 'left'   },
    }
    const config = presets[preset] ?? presets.central
    return sections.map((section) => {
        if (section.type !== 'hero') return section
        const content = { ...(section.content as unknown as Record<string, unknown>) }
        content.layout = config.layout
        content.alignment = config.alignment
        // For the immersive preset, ensure heroImageUrl (if set) moves to backgroundImageUrl
        if (preset === 'immersive') {
            const heroImg = (content.heroImageUrl as string | null) || null
            const bgImg = (content.backgroundImageUrl as string | null) || null
            if (!bgImg && heroImg) {
                content.backgroundImageUrl = heroImg
                content.heroImageUrl = null
            }
        }
        return { ...section, content: content as unknown as LandingPageSection['content'] }
    })
}

export function anchorSectionsWithProductData(product: Product, sections: LandingPageSection[]): LandingPageSection[] {
    const cloned = sections.map((section) => ({
        ...section,
        content: { ...section.content } as LandingPageSection['content'],
    }))

    for (const section of cloned) {
        if (section.type === 'hero') {
            const content = section.content as unknown as Record<string, unknown>
            const headline = String(content.headline ?? '').trim()
            const subheadline = String(content.subheadline ?? '').trim()

            if (!headline || isGenericCopy(headline) || !headline.toLowerCase().includes(product.name.toLowerCase())) {
                content.headline = `Conheça ${product.name}`
            }
            if (!subheadline || isGenericCopy(subheadline)) {
                content.subheadline = product.shortDescription || product.fullDescription || `Solução ideal para ${product.targetAudience || 'o seu negócio'}.`
            }
            section.content = content as unknown as LandingPageSection['content']
        }

        if (section.type === 'features' && product.features.length > 0) {
            const content = section.content as unknown as Record<string, unknown>
            const items = product.features.slice(0, 6).map((feature, index) => ({
                icon: ['Zap', 'Shield', 'Target', 'Rocket', 'CheckCircle', 'Star'][index % 6],
                title: feature.title,
                description: feature.description,
            }))

            content.title = `Funcionalidades de ${product.name}`
            content.subtitle = product.differentials || product.targetAudience || 'Recursos reais do produto selecionado.'
            content.items = items
            section.content = content as unknown as LandingPageSection['content']
        }

        if (section.type === 'faq' && product.faqs.length > 0) {
            const content = section.content as unknown as Record<string, unknown>
            content.title = `Dúvidas sobre ${product.name}`
            content.subtitle = 'Perguntas e respostas baseadas no produto selecionado.'
            content.items = product.faqs.slice(0, 8).map((faq) => ({
                question: faq.question,
                answer: faq.answer,
            }))
            section.content = content as unknown as LandingPageSection['content']
        }

        if (section.type === 'pricing' && product.price !== null) {
            const content = section.content as unknown as Record<string, unknown>
            const tiers = Array.isArray(content.tiers) ? [...(content.tiers as Array<Record<string, unknown>>)] : []
            const firstTier = tiers[0] ?? {}

            firstTier.name = String(firstTier.name ?? product.name)
            firstTier.price = product.formattedPrice
            firstTier.period = product.priceType === 'monthly' ? '/mês' : product.priceType === 'yearly' ? '/ano' : ''
            firstTier.description = String(firstTier.description ?? product.shortDescription)

            if (product.features.length > 0) {
                firstTier.features = product.features.slice(0, 6).map((f) => f.title)
            }

            tiers[0] = firstTier
            content.title = `Investimento em ${product.name}`
            content.subtitle = String(content.subtitle ?? 'Condição baseada no produto selecionado.')
            content.tiers = tiers
            section.content = content as unknown as LandingPageSection['content']
        }

        if (section.type === 'cta_banner') {
            const content = section.content as unknown as Record<string, unknown>
            const title = String(content.title ?? '').trim()
            if (!title || isGenericCopy(title)) {
                content.title = `Pronto para começar com ${product.name}?`
            }
            section.content = content as unknown as LandingPageSection['content']
        }

        if (section.type === 'contact_form') {
            const content = section.content as unknown as Record<string, unknown>
            const title = String(content.title ?? '').trim()
            if (!title || isGenericCopy(title)) {
                content.title = `Fale com nosso time sobre ${product.name}`
            }
            section.content = content as unknown as LandingPageSection['content']
        }
    }

    if (!cloned.some((section) => section.type === 'features') && product.features.length > 0) {
        cloned.push({
            id: crypto.randomUUID(),
            type: 'features',
            order: cloned.length,
            visible: true,
            content: {
                title: `Funcionalidades de ${product.name}`,
                subtitle: product.differentials || 'Recursos do produto selecionado.',
                columns: 3,
                items: product.features.slice(0, 6).map((feature, index) => ({
                    icon: ['Zap', 'Shield', 'Target', 'Rocket', 'CheckCircle', 'Star'][index % 6],
                    title: feature.title,
                    description: feature.description,
                })),
            },
        } as LandingPageSection)
    }

    if (!cloned.some((section) => section.type === 'faq') && product.faqs.length > 0) {
        cloned.push({
            id: crypto.randomUUID(),
            type: 'faq',
            order: cloned.length,
            visible: true,
            content: {
                title: `Dúvidas sobre ${product.name}`,
                subtitle: 'Perguntas frequentes baseadas no produto selecionado.',
                items: product.faqs.slice(0, 8).map((faq) => ({
                    question: faq.question,
                    answer: faq.answer,
                })),
            },
        } as LandingPageSection)
    }

    return cloned.map((section, index) => ({
        ...section,
        order: index,
    }))
}

export function isGenericCopy(text: string): boolean {
    const normalized = text.toLowerCase()
    const genericTokens = [
        'transforme seu negócio',
        'nossos diferenciais',
        'perguntas frequentes',
        'pronto para começar',
        'entre em contato',
        'soluções inovadoras',
    ]
    return genericTokens.some((token) => normalized.includes(token))
}

export function isColorDark(hex: string): boolean {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return false
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance < 0.5
}

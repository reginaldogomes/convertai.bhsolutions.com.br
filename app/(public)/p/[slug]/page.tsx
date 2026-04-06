import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { landingPageRepo } from '@/application/services/container'
import type { LandingPage } from '@/domain/entities'
import type { FaqContent, HeroContent, LandingPageSection } from '@/domain/entities'
import { BRAND } from '@/lib/brand'
import { toAbsoluteUrl } from '@/lib/site-url'
import { LandingPageView } from './landing-page-view'

export const revalidate = 300

const getLandingPageBySlug = cache(async (slug: string) => landingPageRepo.findBySlug(slug))

type PageProps = {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ preview?: string }>
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const { preview } = await searchParams
    const isPreview = preview === '1'
    const page = await getLandingPageBySlug(slug)

    if (!page) {
        return {
            title: `Pagina nao encontrada | ${BRAND.name}`,
            robots: { index: false, follow: false },
        }
    }

    const isIndexable = page.isPublished() && !isPreview
    const canonicalUrl = toAbsoluteUrl(`/p/${page.slug}`)
    const description = getDescription(page)
    const safeSections = sanitizeSections(page.configJson.sections)
    const image = getSeoImage(safeSections)

    if (!isIndexable) {
        return {
            title: `${page.headline || page.name} | Preview`,
            description,
            robots: {
                index: false,
                follow: false,
                noarchive: true,
                nosnippet: true,
                noimageindex: true,
                nocache: true,
                googleBot: {
                    index: false,
                    follow: false,
                    noarchive: true,
                    nosnippet: true,
                    noimageindex: true,
                    nocache: true,
                },
            },
        }
    }

    return {
        title: page.headline || page.name,
        description,
        alternates: {
            canonical: canonicalUrl,
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
            },
        },
        openGraph: {
            type: 'website',
            locale: 'pt_BR',
            title: page.headline || page.name,
            description,
            url: canonicalUrl,
            siteName: BRAND.fullName,
            images: image ? [{ url: image }] : undefined,
        },
        twitter: {
            card: image ? 'summary_large_image' : 'summary',
            title: page.headline || page.name,
            description,
            images: image ? [image] : undefined,
        },
    }
}

export default async function PublicLandingPage({
    params,
    searchParams,
}: PageProps) {
    const { slug } = await params
    const { preview } = await searchParams
    const page = await getLandingPageBySlug(slug)

    if (!page) {
        console.warn('[landing-public] page not found', { slug, preview })
        notFound()
    }

    const isPreview = preview === '1'

    // Allow preview for draft pages via ?preview=1 (used in the editor)
    if (!page.isPublished() && !isPreview) {
        console.warn('[landing-public] draft page accessed without preview token', {
            slug,
            status: page.status,
        })
        notFound()
    }

    const safeSections = sanitizeSections(page.configJson.sections)
    const safeConfig = {
        ...page.configJson,
        sections: safeSections,
    }

    const shouldExposeSeoSignals = page.isPublished() && !isPreview
    const structuredData = shouldExposeSeoSignals ? buildStructuredData(page, safeSections) : []

    if (safeSections.length === 0) {
        console.warn('[landing-public] page loaded without sections, rendering fallback shell', {
            pageId: page.id,
            slug: page.slug,
        })
    }

    return (
        <>
            {structuredData.length > 0 && (
                <script
                    type="application/ld+json"
                    // JSON-LD for rich results (WebPage + optional FAQPage)
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
                />
            )}
            <LandingPageView
                page={{
                    id: page.id,
                    name: page.name,
                    slug: page.slug,
                    headline: page.headline,
                    subheadline: page.subheadline,
                    ctaText: page.ctaText,
                    chatbotName: page.chatbotName,
                    chatbotWelcomeMessage: page.chatbotWelcomeMessage,
                    config: safeConfig,
                }}
            />
        </>
    )
}

function getDescription(page: LandingPage): string {
    return page.subheadline?.trim() || `Conheca ${page.name} na ${BRAND.name}.`
}

function getSeoImage(sections: LandingPageSection[]): string | undefined {
    const heroSection = sections.find((section) => section.type === 'hero')
    if (heroSection) {
        const heroContent = heroSection.content as HeroContent
        const heroImage = heroContent.heroImageUrl || heroContent.backgroundImageUrl
        if (heroImage && isSeoSafeImageUrl(heroImage)) return heroImage
    }

    const gallerySection = sections.find((section) => section.type === 'gallery')
    if (gallerySection) {
        const galleryContent = gallerySection.content as { images?: Array<{ url?: string }> }
        const firstImage = galleryContent.images?.find((image) => Boolean(image.url))?.url
        if (firstImage && isSeoSafeImageUrl(firstImage)) return firstImage
    }

    return undefined
}

function isSeoSafeImageUrl(value: string): boolean {
    const normalized = value.trim()
    if (!normalized) return false
    if (normalized.startsWith('data:')) return false
    if (normalized.startsWith('/')) return true
    return /^https?:\/\//i.test(normalized)
}

function sanitizeSections(value: unknown): LandingPageSection[] {
    if (!Array.isArray(value)) return []

    const safeSections: LandingPageSection[] = []
    for (let index = 0; index < value.length; index += 1) {
        const section = value[index]
        if (!section || typeof section !== 'object') continue

        const obj = section as Record<string, unknown>
        const type = typeof obj.type === 'string' ? obj.type : ''
        if (!isAllowedSectionType(type)) continue

        const content = (obj.content && typeof obj.content === 'object')
            ? sanitizeLargeDataUrls(obj.content as Record<string, unknown>)
            : {}

        safeSections.push({
            id: typeof obj.id === 'string' && obj.id.length > 0 ? obj.id : `${type}-${index}`,
            type,
            order: typeof obj.order === 'number' ? obj.order : index,
            visible: typeof obj.visible === 'boolean' ? obj.visible : true,
            content: content as LandingPageSection['content'],
        } as LandingPageSection)
    }

    return safeSections
}

const MAX_DATA_URL_LENGTH = 1_500_000

function sanitizeLargeDataUrls(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object') return {}

    if (Array.isArray(value)) {
        return value
            .map((item) => sanitizeUnknown(item))
            .filter((item) => item !== undefined) as unknown as Record<string, unknown>
    }

    const result: Record<string, unknown> = {}
    for (const [key, current] of Object.entries(value)) {
        const sanitized = sanitizeUnknown(current)
        if (sanitized !== undefined) {
            result[key] = sanitized
        }
    }

    return result
}

function sanitizeUnknown(value: unknown): unknown {
    if (typeof value === 'string') {
        if (value.startsWith('data:image/') && value.length > MAX_DATA_URL_LENGTH) {
            return null
        }
        return value
    }

    if (Array.isArray(value)) {
        return value
            .map((item) => sanitizeUnknown(item))
            .filter((item) => item !== undefined)
    }

    if (value && typeof value === 'object') {
        const nested: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(value)) {
            const sanitized = sanitizeUnknown(v)
            if (sanitized !== undefined) nested[k] = sanitized
        }
        return nested
    }

    return value
}

function isAllowedSectionType(value: string): value is LandingPageSection['type'] {
    return [
        'hero',
        'features',
        'benefits_grid',
        'process_steps',
        'testimonials',
        'faq',
        'pricing',
        'contact_form',
        'cta_banner',
        'video',
        'stats',
        'logo_cloud',
        'gallery',
    ].includes(value)
}

function buildStructuredData(page: LandingPage, sections: LandingPageSection[]): Array<Record<string, unknown>> {
    const pageUrl = toAbsoluteUrl(`/p/${page.slug}`)
    const webPageData: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: page.headline || page.name,
        description: getDescription(page),
        url: pageUrl,
        inLanguage: 'pt-BR',
        publisher: {
            '@type': 'Organization',
            name: BRAND.fullName,
            url: toAbsoluteUrl('/'),
        },
    }

    const faqSection = sections.find((section) => section.type === 'faq')
    if (!faqSection) return [webPageData]

    const faqContent = faqSection.content as FaqContent
    const hasFaq = Array.isArray(faqContent.items) && faqContent.items.length > 0
    if (!hasFaq) return [webPageData]

    const faqData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqContent.items.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
    }

    return [webPageData, faqData]
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { landingPageRepo } from '@/application/services/container'
import { createAdminClient } from '@/lib/supabase/admin'
import type { LandingPageConfig, LandingPageProps } from '@/domain/entities'
import type { FaqContent, HeroContent, LandingPageSection } from '@/domain/entities'
import { BRAND } from '@/lib/brand'
import { toAbsoluteUrl } from '@/lib/site-url'
import { LandingPageView } from './landing-page-view'

export const revalidate = 1800
export const dynamicParams = true

const STATIC_PRE_RENDER_LIMIT = 200
const DEFAULT_CONFIG: LandingPageConfig = {
    theme: 'dark',
    primaryColor: '#6366f1',
    logoUrl: null,
    sections: [],
}

const getLandingPageBySlugCached = unstable_cache(
    async (slug: string) => {
        const page = await landingPageRepo.findBySlug(slug)
        return page?.props ?? null
    },
    ['landing-page-public-by-slug'],
    { revalidate }
)

const getLandingPageBySlug = cache(async (slug: string, options?: { bypassCache?: boolean }) => {
    if (options?.bypassCache) {
        const page = await landingPageRepo.findBySlug(slug)
        return normalizeLandingPageProps(page?.props)
    }

    const cached = await getLandingPageBySlugCached(slug)
    return normalizeLandingPageProps(cached)
})

type PageProps = {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ preview?: string }>
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
    try {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('landing_pages')
            .select('slug')
            .eq('status', 'published')
            .order('updated_at', { ascending: false })
            .limit(STATIC_PRE_RENDER_LIMIT)

        if (error) {
            console.warn('[landing-public] generateStaticParams failed to load slugs', { message: error.message })
            return []
        }

        return (data ?? [])
            .map((item) => item.slug)
            .filter((slug): slug is string => Boolean(slug && typeof slug === 'string'))
            .map((slug) => ({ slug }))
    } catch (error) {
        console.warn('[landing-public] generateStaticParams unexpected error', {
            message: error instanceof Error ? error.message : 'Unknown error',
        })
        return []
    }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const { preview } = await searchParams
    const isPreview = preview === '1'
    const page = await getLandingPageBySlug(slug, { bypassCache: isPreview })

    if (!page) {
        return {
            title: `Pagina nao encontrada | ${BRAND.name}`,
            robots: { index: false, follow: false },
        }
    }

    const isIndexable = isPagePublished(page) && !isPreview
    const seo = page.configJson.seo
    const canonicalUrl = sanitizeCanonicalUrl(seo?.canonicalUrl) || toAbsoluteUrl(`/p/${page.slug}`)
    const title = seo?.title?.trim() || page.headline || page.name
    const description = seo?.description?.trim() || getDescription(page)
    const safeSections = sanitizeSections(page.configJson.sections)
    const image = getSeoImageFromConfigOrSections(seo?.ogImageUrl, safeSections)
    const keywords = (seo?.keywords && seo.keywords.length > 0) ? seo.keywords : getKeywords(page, safeSections)
    const ogTitle = seo?.ogTitle?.trim() || title
    const ogDescription = seo?.ogDescription?.trim() || description

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
        title,
        description,
        keywords,
        category: 'business',
        alternates: {
            canonical: canonicalUrl,
        },
        robots: {
            index: true,
            follow: true,
            nocache: false,
            maxSnippet: -1,
            maxImagePreview: 'large',
            maxVideoPreview: -1,
            googleBot: {
                index: true,
                follow: true,
                maxSnippet: -1,
                maxImagePreview: 'large',
                maxVideoPreview: -1,
            },
        },
        openGraph: {
            type: 'website',
            locale: 'pt_BR',
            title: ogTitle,
            description: ogDescription,
            url: canonicalUrl,
            siteName: BRAND.fullName,
            images: image
                ? [{
                    url: image,
                    alt: page.headline || page.name,
                }]
                : undefined,
        },
        twitter: {
            card: image ? 'summary_large_image' : 'summary',
            title: ogTitle,
            description: ogDescription,
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
    const isPreview = preview === '1'
    const page = await getLandingPageBySlug(slug, { bypassCache: isPreview })

    if (!page) {
        console.warn('[landing-public] page not found', { slug, preview })
        notFound()
    }

    // Allow preview for draft pages via ?preview=1 (used in the editor)
    if (!isPagePublished(page) && !isPreview) {
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

    const shouldExposeSeoSignals = isPagePublished(page) && !isPreview
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

function isPagePublished(page: LandingPageProps): boolean {
    return page.status === 'published'
}

function normalizeLandingPageProps(input: unknown): LandingPageProps | null {
    if (!input || typeof input !== 'object') return null

    // Cached entities can come as plain props or wrapped as { props: ... }.
    const maybe = input as Partial<LandingPageProps> & { props?: Partial<LandingPageProps> }
    const raw = (maybe.props && typeof maybe.props === 'object') ? maybe.props : maybe

    if (!raw.id || !raw.slug || !raw.name) return null

    return {
        id: raw.id,
        organizationId: raw.organizationId ?? '',
        productId: raw.productId ?? null,
        name: raw.name,
        slug: raw.slug,
        headline: raw.headline ?? raw.name,
        subheadline: raw.subheadline ?? '',
        ctaText: raw.ctaText ?? 'Fale conosco',
        configJson: normalizeLandingPageConfig(raw.configJson),
        chatbotName: raw.chatbotName ?? 'Assistente',
        chatbotWelcomeMessage: raw.chatbotWelcomeMessage ?? 'Olá! Como posso ajudar?',
        chatbotSystemPrompt: raw.chatbotSystemPrompt ?? '',
        status: raw.status ?? 'draft',
        createdAt: raw.createdAt ?? new Date(0).toISOString(),
        updatedAt: raw.updatedAt ?? new Date(0).toISOString(),
    }
}

function normalizeLandingPageConfig(config: unknown): LandingPageConfig {
    if (!config || typeof config !== 'object') return DEFAULT_CONFIG

    const raw = config as Partial<LandingPageConfig>
    return {
        theme: raw.theme === 'light' ? 'light' : 'dark',
        primaryColor: typeof raw.primaryColor === 'string' ? raw.primaryColor : DEFAULT_CONFIG.primaryColor,
        designSystem: raw.designSystem,
        logoUrl: typeof raw.logoUrl === 'string' || raw.logoUrl === null ? raw.logoUrl : DEFAULT_CONFIG.logoUrl,
        sections: sanitizeSections(raw.sections),
    }
}

function getKeywords(page: LandingPageProps, sections: LandingPageSection[]): string[] {
    const keywords = new Set<string>()

    const pushTokens = (value: string | undefined) => {
        if (!value) return
        const cleaned = value.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ')
        for (const token of cleaned.split(/\s+/)) {
            const t = token.trim()
            if (t.length >= 4) keywords.add(t)
            if (keywords.size >= 20) return
        }
    }

    pushTokens(page.name)
    pushTokens(page.headline)
    pushTokens(page.subheadline)

    const featureSection = sections.find((section) => section.type === 'features')
    const featureItems = (featureSection?.content as { items?: Array<{ title?: string }> } | undefined)?.items ?? []
    for (const item of featureItems.slice(0, 5)) {
        pushTokens(item.title)
        if (keywords.size >= 20) break
    }

    return Array.from(keywords)
}

function getDescription(page: LandingPageProps): string {
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

function getSeoImageFromConfigOrSections(
    candidate: string | undefined,
    sections: LandingPageSection[],
): string | undefined {
    if (candidate && isSeoSafeImageUrl(candidate)) return candidate
    return getSeoImage(sections)
}

function sanitizeCanonicalUrl(value: string | undefined): string | undefined {
    if (!value) return undefined
    const normalized = value.trim()
    if (!normalized) return undefined
    if (/^https?:\/\//i.test(normalized)) return normalized
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

function buildStructuredData(page: LandingPageProps, sections: LandingPageSection[]): Array<Record<string, unknown>> {
    const pageUrl = toAbsoluteUrl(`/p/${page.slug}`)
    const siteUrl = toAbsoluteUrl('/')

    const organizationData: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: BRAND.fullName,
        url: siteUrl,
    }

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
            url: siteUrl,
        },
    }

    const breadcrumbData: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Inicio',
                item: siteUrl,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: page.headline || page.name,
                item: pageUrl,
            },
        ],
    }

    const graph: Array<Record<string, unknown>> = [organizationData, webPageData, breadcrumbData]

    const productData = buildProductStructuredData(page, sections, pageUrl)
    if (productData) graph.push(productData)

    const faqSection = sections.find((section) => section.type === 'faq')
    if (!faqSection) return graph

    const faqContent = faqSection.content as FaqContent
    const hasFaq = Array.isArray(faqContent.items) && faqContent.items.length > 0
    if (!hasFaq) return graph

    const faqData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqContent.items
            .filter((item) => item.question?.trim() && item.answer?.trim())
            .slice(0, 10)
            .map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
            })),
    }

    graph.push(faqData)
    return graph
}

function buildProductStructuredData(
    page: LandingPageProps,
    sections: LandingPageSection[],
    pageUrl: string,
): Record<string, unknown> | null {
    const pricingSection = sections.find((section) => section.type === 'pricing')
    const featureSection = sections.find((section) => section.type === 'features')

    const features = ((featureSection?.content as { items?: Array<{ title?: string }> } | undefined)?.items ?? [])
        .map((item) => item.title?.trim())
        .filter((value): value is string => Boolean(value))
        .slice(0, 8)

    const firstTier = ((pricingSection?.content as { tiers?: Array<Record<string, unknown>> } | undefined)?.tiers ?? [])[0]
    const rawPrice = typeof firstTier?.price === 'string' ? firstTier.price : undefined
    const parsedPrice = parseBrazilianPrice(rawPrice)

    const productData: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: page.headline || page.name,
        description: getDescription(page),
        url: pageUrl,
        brand: {
            '@type': 'Brand',
            name: BRAND.fullName,
        },
        category: 'SoftwareApplication',
    }

    if (features.length > 0) {
        productData.additionalProperty = features.map((feature) => ({
            '@type': 'PropertyValue',
            name: 'feature',
            value: feature,
        }))
    }

    if (parsedPrice !== null) {
        productData.offers = {
            '@type': 'Offer',
            url: pageUrl,
            priceCurrency: 'BRL',
            price: parsedPrice,
            availability: 'https://schema.org/InStock',
        }
    }

    return productData
}

function parseBrazilianPrice(value: string | undefined): number | null {
    if (!value) return null
    const cleaned = value
        .replace(/R\$\s?/gi, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .replace(/[^\d.]/g, '')

    if (!cleaned) return null
    const parsed = Number.parseFloat(cleaned)
    if (!Number.isFinite(parsed) || parsed <= 0) return null
    return Number(parsed.toFixed(2))
}

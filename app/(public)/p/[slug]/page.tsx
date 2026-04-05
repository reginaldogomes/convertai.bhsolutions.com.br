import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { landingPageRepo } from '@/application/services/container'
import type { LandingPage } from '@/domain/entities'
import type { FaqContent, HeroContent, LandingPageSection } from '@/domain/entities'
import { BRAND } from '@/lib/brand'
import { toAbsoluteUrl } from '@/lib/site-url'
import { LandingPageView } from './landing-page-view'

export const revalidate = 300

type PageProps = {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ preview?: string }>
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const { preview } = await searchParams
    const isPreview = preview === '1'
    const page = await landingPageRepo.findBySlug(slug)

    if (!page) {
        return {
            title: `Pagina nao encontrada | ${BRAND.name}`,
            robots: { index: false, follow: false },
        }
    }

    const isIndexable = page.isPublished() && !isPreview
    const canonicalUrl = toAbsoluteUrl(`/p/${page.slug}`)
    const description = getDescription(page)
    const image = getSeoImage(page.configJson.sections)

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
    const page = await landingPageRepo.findBySlug(slug)

    if (!page) notFound()
    // Allow preview for draft pages via ?preview=1 (used in the editor)
    if (!page.isPublished() && preview !== '1') notFound()

    const shouldExposeSeoSignals = page.isPublished() && preview !== '1'
    const structuredData = shouldExposeSeoSignals ? buildStructuredData(page) : []

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
                    config: page.configJson,
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
        if (heroImage) return heroImage
    }

    const gallerySection = sections.find((section) => section.type === 'gallery')
    if (gallerySection) {
        const galleryContent = gallerySection.content as { images?: Array<{ url?: string }> }
        const firstImage = galleryContent.images?.find((image) => Boolean(image.url))?.url
        if (firstImage) return firstImage
    }

    return undefined
}

function buildStructuredData(page: LandingPage): Array<Record<string, unknown>> {
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

    const faqSection = page.configJson.sections.find((section) => section.type === 'faq')
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

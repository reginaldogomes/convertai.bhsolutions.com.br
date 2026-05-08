import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { BRAND } from '@/lib/brand'
import { toAbsoluteUrl } from '@/lib/site-url'
import { SitePageView } from '../site-page-view'
import type { LandingPageSection } from '@/domain/entities'

export const revalidate = 1800
export const dynamicParams = true

type PageProps = {
    params: Promise<{ slug: string; 'page-slug': string }>
}

const getSiteCached = unstable_cache(
    async (siteSlug: string) => {
        const admin = createAdminClient()
        const { data } = await admin
            .from('sites')
            .select('id, name, slug, config_json, primary_color, logo_url, description, theme, status')
            .eq('slug', siteSlug)
            .eq('status', 'published')
            .single()
        return data ?? null
    },
    ['site-public-by-slug'],
    { revalidate, tags: ['sites'] }
)

const getSitePagesCached = unstable_cache(
    async (siteId: string) => {
        const admin = createAdminClient()
        const { data } = await admin
            .from('landing_pages')
            .select('id, name, slug, is_homepage, config_json, headline, subheadline, cta_text, chatbot_name, chatbot_welcome_message, status')
            .eq('site_id', siteId)
            .eq('status', 'published')
            .order('is_homepage', { ascending: false })
        return data ?? []
    },
    ['site-pages-by-site-id'],
    { revalidate, tags: ['landing-pages', 'sites'] }
)

export async function generateStaticParams(): Promise<Array<{ slug: string; 'page-slug': string }>> {
    try {
        const admin = createAdminClient()
        const { data: sites } = await admin.from('sites').select('id, slug').eq('status', 'published').limit(100)
        if (!sites?.length) return []

        const results: Array<{ slug: string; 'page-slug': string }> = []
        for (const site of sites) {
            const { data: pages } = await admin
                .from('landing_pages')
                .select('slug')
                .eq('site_id', site.id)
                .eq('status', 'published')
                .eq('is_homepage', false)
            for (const page of pages ?? []) {
                if (page.slug) results.push({ slug: site.slug, 'page-slug': page.slug })
            }
        }
        return results
    } catch {
        return []
    }
}

function sanitizeSections(sections: unknown): LandingPageSection[] {
    if (!Array.isArray(sections)) return []
    const VALID_TYPES = new Set([
        'hero', 'features', 'benefits_grid', 'process_steps', 'about_expert',
        'testimonials', 'faq', 'pricing', 'contact_form', 'cta_banner',
        'video', 'stats', 'logo_cloud', 'gallery',
    ])
    return sections.filter((s): s is LandingPageSection =>
        s && typeof s === 'object' && VALID_TYPES.has(s.type) && s.visible !== false
    )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug, 'page-slug': pageSlug } = await params
    const site = await getSiteCached(slug)
    if (!site) return { title: `Não encontrado | ${BRAND.name}`, robots: { index: false, follow: false } }

    const pages = await getSitePagesCached(site.id)
    const page = pages.find(p => p.slug === pageSlug)
    if (!page) return { title: `Não encontrado | ${BRAND.name}`, robots: { index: false, follow: false } }

    const pageCfg = (page.config_json as Record<string, any>) ?? {}
    const seo = pageCfg.seo ?? {}
    const title = seo.title?.trim() || page.headline || page.name
    const description = seo.description?.trim() || page.subheadline || ''
    const canonicalUrl = toAbsoluteUrl(`/s/${slug}/${pageSlug}`)

    return {
        title,
        description,
        alternates: { canonical: canonicalUrl },
        openGraph: { title, description, url: canonicalUrl, type: 'website' },
        robots: { index: true, follow: true },
    }
}

export default async function SiteSubPage({ params }: PageProps) {
    const { slug, 'page-slug': pageSlug } = await params
    const site = await getSiteCached(slug)
    if (!site) notFound()

    const pages = await getSitePagesCached(site.id)
    const page = pages.find(p => p.slug === pageSlug)
    if (!page) notFound()

    const cfg = (site.config_json as Record<string, any>) ?? {}
    const pageCfg = (page.config_json as Record<string, any>) ?? {}
    const sections = sanitizeSections(pageCfg.sections ?? [])

    const siteConfig = {
        theme: (cfg.theme ?? site.theme ?? 'dark') as 'light' | 'dark',
        primaryColor: site.primary_color ?? cfg.primaryColor ?? '#6366f1',
        designSystem: pageCfg.designSystem ?? cfg.designSystem,
        logoUrl: site.logo_url ?? cfg.logoUrl ?? null,
    }

    return (
        <SitePageView
            siteSlug={site.slug}
            siteName={site.name}
            siteConfig={siteConfig}
            page={{
                id: page.id,
                name: page.name,
                slug: page.slug,
                headline: page.headline ?? '',
                subheadline: page.subheadline ?? '',
                ctaText: page.cta_text ?? '',
                chatbotName: page.chatbot_name ?? '',
                chatbotWelcomeMessage: page.chatbot_welcome_message ?? '',
                sections,
            }}
            pages={pages.map(p => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                isHomepage: p.is_homepage ?? false,
            }))}
        />
    )
}

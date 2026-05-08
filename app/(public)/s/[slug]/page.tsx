import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { useCases, landingPageRepo } from '@/application/services/container'
import { BRAND } from '@/lib/brand'
import { toAbsoluteUrl } from '@/lib/site-url'
import { SiteView } from './site-view'
import type { LandingPageSection } from '@/domain/entities'

export const revalidate = 1800
export const dynamicParams = true

type PageProps = {
    params: Promise<{ slug: string }>
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

const getSiteCached = unstable_cache(
    async (slug: string) => {
        const admin = createAdminClient()
        const { data } = await admin
            .from('sites')
            .select('id, name, slug, config_json, primary_color, logo_url, description, theme, status')
            .eq('slug', slug)
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

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
    try {
        const admin = createAdminClient()
        const { data } = await admin
            .from('sites')
            .select('slug')
            .eq('status', 'published')
            .limit(100)
        return (data ?? [])
            .map(r => r.slug)
            .filter((s): s is string => Boolean(s))
            .map(slug => ({ slug }))
    } catch {
        return []
    }
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const site = await getSiteCached(slug)

    if (!site) {
        return { title: `Página não encontrada | ${BRAND.name}`, robots: { index: false, follow: false } }
    }

    const cfg = (site.config_json as Record<string, any>) ?? {}
    const seo = cfg.seo ?? {}
    const title = seo.title?.trim() || site.name
    const description = seo.description?.trim() || site.description || ''
    const canonicalUrl = toAbsoluteUrl(`/s/${site.slug}`)

    return {
        title,
        description,
        keywords: seo.keywords ?? [],
        alternates: { canonical: canonicalUrl },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            type: 'website',
        },
        twitter: { card: 'summary_large_image', title, description },
        robots: { index: true, follow: true },
    }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

export default async function SitePublicPage({ params }: PageProps) {
    const { slug } = await params
    const site = await getSiteCached(slug)
    if (!site) notFound()

    const pages = await getSitePagesCached(site.id)
    const homepage = pages.find(p => p.is_homepage) ?? pages[0]
    if (!homepage) notFound()

    const cfg = (site.config_json as Record<string, any>) ?? {}
    const hpCfg = (homepage.config_json as Record<string, any>) ?? {}
    const sections = sanitizeSections(hpCfg.sections ?? cfg.sections ?? [])

    const siteConfig = {
        theme: (cfg.theme ?? site.theme ?? 'dark') as 'light' | 'dark',
        primaryColor: site.primary_color ?? cfg.primaryColor ?? '#6366f1',
        designSystem: hpCfg.designSystem ?? cfg.designSystem,
        logoUrl: site.logo_url ?? cfg.logoUrl ?? null,
        seo: cfg.seo,
    }

    return (
        <SiteView
            siteSlug={site.slug}
            siteName={site.name}
            siteConfig={siteConfig}
            homepage={{
                id: homepage.id,
                name: homepage.name,
                slug: homepage.slug,
                headline: homepage.headline ?? '',
                subheadline: homepage.subheadline ?? '',
                ctaText: homepage.cta_text ?? '',
                chatbotName: homepage.chatbot_name ?? '',
                chatbotWelcomeMessage: homepage.chatbot_welcome_message ?? '',
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

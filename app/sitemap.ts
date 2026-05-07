import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSiteUrl } from '@/lib/site-url'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const siteUrl = getSiteUrl()
    let landingEntries: MetadataRoute.Sitemap = []

    try {
        const supabase = createAdminClient()
        const { data: pages } = await supabase
            .from('landing_pages')
            .select('slug, updated_at')
            .eq('status', 'published')
            .order('updated_at', { ascending: false })

        landingEntries = (pages ?? []).map((page) => ({
            url: `${siteUrl}/p/${page.slug}`,
            lastModified: page.updated_at,
            changeFrequency: 'weekly',
            priority: 0.7,
        }))
    } catch (error) {
        console.warn('[sitemap] failed to load published landing pages', {
            message: error instanceof Error ? error.message : 'Unknown error',
        })
    }

    return [
        {
            url: siteUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        ...landingEntries,
    ]
}

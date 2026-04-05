import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSiteUrl } from '@/lib/site-url'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const siteUrl = getSiteUrl()
    const supabase = createAdminClient()

    const { data: pages } = await supabase
        .from('landing_pages')
        .select('slug, updated_at')
        .eq('status', 'published')
        .order('updated_at', { ascending: false })

    const landingEntries: MetadataRoute.Sitemap = (pages ?? []).map((page) => ({
        url: `${siteUrl}/p/${page.slug}`,
        lastModified: page.updated_at,
        changeFrequency: 'weekly',
        priority: 0.7,
    }))

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

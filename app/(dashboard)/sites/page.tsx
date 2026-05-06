import { listSites } from '@/actions/sites'
import { getSiteUrl } from '@/lib/site-url'
import { SitesPageClient } from './sites-page-client'

export default async function SitesPage() {
    const { sites, error } = await listSites()
    const appUrl = getSiteUrl()

    // Converter instâncias de Site para plain objects para passar ao Client Component
    const plainSites = sites.map(site => ({
        id: site.id,
        name: site.name,
        createdAt: site.createdAt, // Já é uma string ISO
        defaultUrl: `${appUrl}/sites/${site.id}`, // URL padrão do sistema
    }))

    return <SitesPageClient initialSites={plainSites} initialError={error} />
}
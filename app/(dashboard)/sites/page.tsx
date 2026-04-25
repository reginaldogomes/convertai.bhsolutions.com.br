import { listSites } from '@/actions/sites'
import { SitesPageClient } from './sites-page-client'

export default async function SitesPage() {
    const { sites, error } = await listSites()

    // Converter instâncias de Site para plain objects para passar ao Client Component
    const plainSites = sites.map(site => ({
        id: site.id,
        name: site.name,
        createdAt: site.createdAt.toISOString(), // Converter Date para string
    }))

    return <SitesPageClient initialSites={plainSites} initialError={error} />
}
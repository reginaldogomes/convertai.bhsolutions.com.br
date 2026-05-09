import { listSites } from '@/actions/sites'
import { getSiteUrl } from '@/lib/site-url'
import { SitesPageClient } from './sites-page-client'

export default async function SitesPage() {
    const { sites, error } = await listSites()
    const appUrl = getSiteUrl()

    return <SitesPageClient initialSites={sites} initialError={error} />
}
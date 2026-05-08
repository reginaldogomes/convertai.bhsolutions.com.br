import { notFound } from 'next/navigation'
import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { SiteSettingsPage } from './site-settings-page'

interface SiteSettingsPageProps {
    params: Promise<{ id: string }>
    searchParams: Promise<{ tab?: string }>
}

export default async function SiteSettingsRoute({ params, searchParams }: SiteSettingsPageProps) {
    const auth = await tryGetAuthContext()
    if (!auth) {
        return notFound()
    }

    const { id } = await params
    const { tab } = await searchParams
    if (!id || id === 'undefined') {
        return notFound()
    }

    try {
        const site = await useCases.getSiteDetail().execute(auth.orgId, id)
        const allPages = await useCases.listLandingPages().execute(auth.orgId)
        const sitePages = allPages.filter(p => p.props.siteId === id)

        return (
            <SiteSettingsPage
                initialSite={{
                    id: site.id,
                    name: site.name,
                    configJson: site.configJson,
                    primaryColor: site.primaryColor,
                    logoUrl: site.logoUrl,
                    description: site.description,
                    theme: site.theme,
                    status: site.status,
                    createdAt: site.createdAt.toISOString(),
                }}
                initialPages={sitePages.map(p => ({
                    id: p.props.id,
                    name: p.props.name,
                    slug: p.props.slug,
                    status: p.props.status,
                    isHomepage: p.props.isHomepage,
                }))}
                defaultTab={tab ?? 'general'}
            />
        )
    } catch {
        return notFound()
    }
}

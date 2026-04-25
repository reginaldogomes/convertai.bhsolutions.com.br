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

        return (
            <SiteSettingsPage
                initialSite={{
                    id: site.id,
                    name: site.name,
                    createdAt: site.createdAt.toISOString(),
                }}
                defaultTab={tab ?? 'general'}
            />
        )
    } catch {
        return notFound()
    }
}

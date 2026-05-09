import { notFound } from 'next/navigation'
import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from '@/actions/utils'
import { SitePagesClient } from './site-pages-client'

interface SitePagesPageProps {
    params: Promise<{ id: string }>
}

export default async function SitePagesPage({ params }: SitePagesPageProps) {
    const { id: siteId } = await params
    if (!siteId || siteId === 'undefined') return notFound()

    try {
        const auth = await tryGetAuthContext()
        if (!auth) return <div>Não autorizado</div>

        const allPages = await useCases.listLandingPages().execute(auth.orgId)
        const sitePages = allPages.filter((page) => page.siteId === siteId)

        const plainLandingPages = sitePages.map((page) => ({
            id: page.id,
            title: page.name,
            slug: page.slug,
            isPublished: page.isPublished(),
            isHomepage: page.isHomepage,
            createdAt: page.createdAt,
            updatedAt: page.updatedAt,
        }))

        return <SitePagesClient initialLandingPages={plainLandingPages} siteId={siteId} />
    } catch (error) {
        const errorMessage = getErrorMessage(error)
        return <SitePagesClient initialLandingPages={[]} siteId={siteId} initialError={errorMessage} />
    }
}
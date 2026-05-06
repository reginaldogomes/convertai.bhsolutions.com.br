import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from '@/actions/utils'
import { SitePagesClient } from './site-pages-client'

export default async function SitePagesPage() {
    try {
        const auth = await tryGetAuthContext()
        if (!auth) {
            return <div>Não autorizado</div>
        }

        // Buscar todas as landing pages da organização e converter para plain objects
        const landingPages = await useCases.listLandingPages().execute(auth.orgId)
        const plainLandingPages = landingPages.map((page) => ({
            id: page.id,
            title: page.name,
            slug: page.slug,
            isPublished: page.isPublished(),
            isHomepage: false,
            createdAt: page.createdAt,
            updatedAt: page.updatedAt,
        }))

        return <SitePagesClient initialLandingPages={plainLandingPages} />
    } catch (error) {
        const errorMessage = getErrorMessage(error)
        return <SitePagesClient initialLandingPages={[]} initialError={errorMessage} />
    }
}
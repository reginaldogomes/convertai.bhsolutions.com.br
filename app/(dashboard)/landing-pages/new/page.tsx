import { redirect } from 'next/navigation'
import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { PageHeader } from '@/components/layout/PageHeader'
import { NewLandingPageForm } from '@/components/crm/NewLandingPageForm'
import { Globe } from 'lucide-react'
import Link from 'next/link'

export default async function NewLandingPagePage() {
    const auth = await tryGetAuthContext()
    if (!auth) redirect('/login')

    const activeProducts = await useCases.listActiveProducts().execute(auth.orgId)

    const products = activeProducts.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        type: p.type,
        shortDescription: p.shortDescription,
        fullDescription: p.fullDescription,
        targetAudience: p.targetAudience,
        differentials: p.differentials,
        features: p.features,
        benefits: p.benefits,
        faqs: p.faqs,
        price: p.formattedPrice,
    }))

    return (
        <div className="p-6 md:p-8 space-y-6">
            <PageHeader
                category="Landing Pages"
                title="Nova Landing Page"
                icon={Globe}
                actions={
                    <Link
                        href="/landing-pages"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancelar
                    </Link>
                }
            />
            <NewLandingPageForm products={products} />
        </div>
    )
}

import { notFound } from 'next/navigation'
import { landingPageRepo } from '@/application/services/container'
import { LandingPageView } from './landing-page-view'

export const dynamic = 'force-dynamic'

export default async function PublicLandingPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ preview?: string }>
}) {
    const { slug } = await params
    const { preview } = await searchParams
    const page = await landingPageRepo.findBySlug(slug)

    if (!page) notFound()
    // Allow preview for draft pages via ?preview=1 (used in the editor)
    if (!page.isPublished() && preview !== '1') notFound()

    return (
        <LandingPageView
            page={{
                id: page.id,
                name: page.name,
                slug: page.slug,
                headline: page.headline,
                subheadline: page.subheadline,
                ctaText: page.ctaText,
                chatbotName: page.chatbotName,
                chatbotWelcomeMessage: page.chatbotWelcomeMessage,
                config: page.configJson,
            }}
        />
    )
}

import { notFound } from 'next/navigation'
import { landingPageRepo, analyticsRepo } from '@/application/services/container'
import { LandingPageView } from './landing-page-view'

export const dynamic = 'force-dynamic'

export default async function PublicLandingPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const page = await landingPageRepo.findBySlug(slug)

    if (!page) notFound()

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

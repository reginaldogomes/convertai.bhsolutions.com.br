import type { LandingPage } from '@/domain/entities'
import type { LandingPageStatus } from '@/types/database'

export interface CreateLandingPageInput {
    organizationId: string
    productId?: string | null
    name: string
    slug: string
    headline: string
    subheadline: string
    ctaText?: string
    chatbotName?: string
    chatbotWelcomeMessage?: string
    chatbotSystemPrompt?: string
    configJson?: Record<string, unknown>
}

export interface UpdateLandingPageInput {
    name?: string
    slug?: string
    headline?: string
    subheadline?: string
    ctaText?: string
    chatbotName?: string
    chatbotWelcomeMessage?: string
    chatbotSystemPrompt?: string
    configJson?: Record<string, unknown>
}

export interface ILandingPageRepository {
    findById(id: string): Promise<LandingPage | null>
    findBySlug(slug: string): Promise<LandingPage | null>
    findByOrgId(orgId: string): Promise<LandingPage[]>
    create(input: CreateLandingPageInput): Promise<LandingPage | null>
    update(id: string, orgId: string, input: UpdateLandingPageInput): Promise<LandingPage | null>
    updateStatus(id: string, orgId: string, status: LandingPageStatus): Promise<boolean>
    delete(id: string, orgId: string): Promise<boolean>
}

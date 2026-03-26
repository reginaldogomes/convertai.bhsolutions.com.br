import type { LandingPageStatus} from '@/types/database'
import type { LandingPageSection } from './landing-page-sections'

export interface LandingPageConfig {
    theme: 'light' | 'dark'
    primaryColor: string
    logoUrl: string | null
    sections: LandingPageSection[]
}

export interface LandingPageProps {
    id: string
    organizationId: string
    name: string
    slug: string
    headline: string
    subheadline: string
    ctaText: string
    configJson: LandingPageConfig
    chatbotName: string
    chatbotWelcomeMessage: string
    chatbotSystemPrompt: string
    status: LandingPageStatus
    createdAt: string
    updatedAt: string
}

const DEFAULT_CONFIG: LandingPageConfig = {
    theme: 'light',
    primaryColor: '#6366f1',
    logoUrl: null,
    sections: [],
}

export class LandingPage {
    constructor(public readonly props: LandingPageProps) {}

    get id() { return this.props.id }
    get organizationId() { return this.props.organizationId }
    get name() { return this.props.name }
    get slug() { return this.props.slug }
    get headline() { return this.props.headline }
    get subheadline() { return this.props.subheadline }
    get ctaText() { return this.props.ctaText }
    get configJson() { return this.props.configJson }
    get chatbotName() { return this.props.chatbotName }
    get chatbotWelcomeMessage() { return this.props.chatbotWelcomeMessage }
    get chatbotSystemPrompt() { return this.props.chatbotSystemPrompt }
    get status() { return this.props.status }
    get createdAt() { return this.props.createdAt }
    get updatedAt() { return this.props.updatedAt }

    isDraft(): boolean { return this.status === 'draft' }
    isPublished(): boolean { return this.status === 'published' }
    isArchived(): boolean { return this.status === 'archived' }

    static fromRow(row: {
        id: string
        organization_id: string
        name: string
        slug: string
        headline: string
        subheadline: string
        cta_text: string
        config_json: unknown
        chatbot_name: string
        chatbot_welcome_message: string
        chatbot_system_prompt: string
        status: string
        created_at: string
        updated_at: string
    }): LandingPage {
        const rawConfig = row.config_json as Record<string, unknown> | null
        return new LandingPage({
            id: row.id,
            organizationId: row.organization_id,
            name: row.name,
            slug: row.slug,
            headline: row.headline,
            subheadline: row.subheadline,
            ctaText: row.cta_text,
            configJson: {
                theme: (rawConfig?.theme as 'light' | 'dark') ?? DEFAULT_CONFIG.theme,
                primaryColor: (rawConfig?.primaryColor as string) ?? DEFAULT_CONFIG.primaryColor,
                logoUrl: (rawConfig?.logoUrl as string | null) ?? DEFAULT_CONFIG.logoUrl,
                sections: (Array.isArray(rawConfig?.sections) ? rawConfig.sections : []) as LandingPageSection[],
            },
            chatbotName: row.chatbot_name,
            chatbotWelcomeMessage: row.chatbot_welcome_message,
            chatbotSystemPrompt: row.chatbot_system_prompt,
            status: row.status as LandingPageStatus,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        })
    }
}

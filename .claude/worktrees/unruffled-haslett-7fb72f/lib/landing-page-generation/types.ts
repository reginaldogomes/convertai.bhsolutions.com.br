import type { SectionType } from '@/domain/entities'
import type { DesignSystem } from '@/domain/value-objects/design-system'
import type { NanoBananaModelId } from '../nano-banana'

export interface LandingPageGenerationInput {
    prompt: string
    pageContext?: { name?: string; headline?: string; subheadline?: string }
    productContext?: string
    knowledgeBaseContext?: string
    seoContext?: {
        primaryTopic?: string
        targetAudience?: string
        locale?: string
        intentKeywords?: string[]
    }
    imageGeneration?: {
        enabled?: boolean
        model?: NanoBananaModelId
    }
}

export interface GeneratedSection {
    type: SectionType
    content: Record<string, unknown>
}

export interface LandingPageGenerationOutput {
    sections: GeneratedSection[]
    designSystem: DesignSystem
}

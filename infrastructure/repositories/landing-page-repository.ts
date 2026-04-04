import { createAdminClient } from '@/lib/supabase/admin'
import { LandingPage } from '@/domain/entities'
import type { ILandingPageRepository, CreateLandingPageInput, UpdateLandingPageInput } from '@/domain/interfaces'
import type { LandingPageStatus } from '@/types/database'
import { DEFAULT_DESIGN_SYSTEM } from '@/domain/value-objects/design-system'

export class SupabaseLandingPageRepository implements ILandingPageRepository {
    async findById(id: string): Promise<LandingPage | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('landing_pages')
            .select('*')
            .eq('id', id)
            .single()
        return data ? LandingPage.fromRow(data) : null
    }

    async findBySlug(slug: string): Promise<LandingPage | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('landing_pages')
            .select('*')
            .eq('slug', slug)
            .single()
        return data ? LandingPage.fromRow(data) : null
    }

    async findByOrgId(orgId: string): Promise<LandingPage[]> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('landing_pages')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
        return (data ?? []).map(LandingPage.fromRow)
    }

    async create(input: CreateLandingPageInput): Promise<LandingPage | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('landing_pages')
            .insert({
                organization_id: input.organizationId,
                name: input.name,
                slug: input.slug,
                headline: input.headline,
                subheadline: input.subheadline,
                cta_text: input.ctaText,
                chatbot_name: input.chatbotName,
                chatbot_welcome_message: input.chatbotWelcomeMessage,
                chatbot_system_prompt: input.chatbotSystemPrompt,
                config_json: (input.configJson ?? {
                    theme: 'dark',
                    primaryColor: DEFAULT_DESIGN_SYSTEM.palette.primary,
                    designSystem: DEFAULT_DESIGN_SYSTEM,
                    logoUrl: null,
                }) as Record<string, string>,
            })
            .select()
            .single()
        return data ? LandingPage.fromRow(data) : null
    }

    async update(id: string, orgId: string, input: UpdateLandingPageInput): Promise<LandingPage | null> {
        const supabase = createAdminClient()
        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (input.name !== undefined) updateData.name = input.name
        if (input.slug !== undefined) updateData.slug = input.slug
        if (input.headline !== undefined) updateData.headline = input.headline
        if (input.subheadline !== undefined) updateData.subheadline = input.subheadline
        if (input.ctaText !== undefined) updateData.cta_text = input.ctaText
        if (input.chatbotName !== undefined) updateData.chatbot_name = input.chatbotName
        if (input.chatbotWelcomeMessage !== undefined) updateData.chatbot_welcome_message = input.chatbotWelcomeMessage
        if (input.chatbotSystemPrompt !== undefined) updateData.chatbot_system_prompt = input.chatbotSystemPrompt
        if (input.configJson !== undefined) updateData.config_json = input.configJson

        const { data } = await supabase
            .from('landing_pages')
            .update(updateData)
            .eq('id', id)
            .eq('organization_id', orgId)
            .select()
            .single()
        return data ? LandingPage.fromRow(data) : null
    }

    async updateStatus(id: string, orgId: string, status: LandingPageStatus): Promise<boolean> {
        const supabase = createAdminClient()
        const { error } = await supabase
            .from('landing_pages')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('organization_id', orgId)
        return !error
    }

    async delete(id: string, orgId: string): Promise<boolean> {
        const supabase = createAdminClient()
        const { error } = await supabase
            .from('landing_pages')
            .delete()
            .eq('id', id)
            .eq('organization_id', orgId)
        return !error
    }
}

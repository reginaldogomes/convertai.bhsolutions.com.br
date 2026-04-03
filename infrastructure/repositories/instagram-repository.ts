import { createAdminClient } from '@/lib/supabase/admin'
import { InstagramContent } from '@/domain/entities/instagram-content'
import type {
    IInstagramContentRepository,
    IInstagramAccountRepository,
    IInstagramAutoConfigRepository,
    CreateInstagramContentInput,
    UpdateInstagramContentInput,
} from '@/domain/interfaces/instagram-repository'
import type { InstagramContentRow, InstagramContentStatus, InstagramAccountRow, InstagramAutoConfigRow } from '@/types/instagram'

export class SupabaseInstagramContentRepository implements IInstagramContentRepository {
    async findById(id: string): Promise<InstagramContent | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('instagram_contents')
            .select('*')
            .eq('id', id)
            .single()
        return data ? InstagramContent.fromRow(data) : null
    }

    async findByOrgId(orgId: string): Promise<InstagramContentRow[]> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('instagram_contents')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
        return (data ?? []) as unknown as InstagramContentRow[]
    }

    async create(input: CreateInstagramContentInput): Promise<InstagramContent | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('instagram_contents')
            .insert({
                organization_id: input.organizationId,
                type: input.type,
                caption: input.caption,
                media_urls: input.mediaUrls,
                thumbnail_url: input.thumbnailUrl || null,
                hashtags: input.hashtags || [],
                status: 'draft',
            })
            .select()
            .single()
        return data ? InstagramContent.fromRow(data) : null
    }

    async update(id: string, orgId: string, input: UpdateInstagramContentInput): Promise<InstagramContent | null> {
        const supabase = createAdminClient()
        const updateData: Record<string, unknown> = {}
        if (input.caption !== undefined) updateData.caption = input.caption
        if (input.mediaUrls !== undefined) updateData.media_urls = input.mediaUrls
        if (input.thumbnailUrl !== undefined) updateData.thumbnail_url = input.thumbnailUrl
        if (input.hashtags !== undefined) updateData.hashtags = input.hashtags
        if (input.type !== undefined) updateData.type = input.type

        const { data } = await supabase
            .from('instagram_contents')
            .update(updateData)
            .eq('id', id)
            .eq('organization_id', orgId)
            .eq('status', 'draft')
            .select()
            .single()
        return data ? InstagramContent.fromRow(data) : null
    }

    async updateStatus(id: string, orgId: string, status: InstagramContentStatus, extra?: Record<string, unknown>): Promise<boolean> {
        const supabase = createAdminClient()
        const updateData: Record<string, unknown> = { status }
        if (status === 'published') updateData.published_at = new Date().toISOString()
        if (extra) Object.assign(updateData, extra)

        const { error } = await supabase
            .from('instagram_contents')
            .update(updateData)
            .eq('id', id)
            .eq('organization_id', orgId)
        return !error
    }

    async delete(id: string, orgId: string): Promise<boolean> {
        const supabase = createAdminClient()
        const { error } = await supabase
            .from('instagram_contents')
            .delete()
            .eq('id', id)
            .eq('organization_id', orgId)
            .eq('status', 'draft')
        return !error
    }

    async countByOrgId(orgId: string): Promise<number> {
        const supabase = createAdminClient()
        const { count } = await supabase
            .from('instagram_contents')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId)
        return count ?? 0
    }
}

export class SupabaseInstagramAccountRepository implements IInstagramAccountRepository {
    async findByOrgId(orgId: string): Promise<InstagramAccountRow | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('instagram_accounts')
            .select('*')
            .eq('organization_id', orgId)
            .single()
        return data as InstagramAccountRow | null
    }

    async upsert(orgId: string, data: Omit<InstagramAccountRow, 'id' | 'organization_id' | 'connected_at'>): Promise<boolean> {
        const supabase = createAdminClient()
        const { error } = await supabase
            .from('instagram_accounts')
            .upsert({
                organization_id: orgId,
                ...data,
            }, { onConflict: 'organization_id' })
        return !error
    }

    async delete(orgId: string): Promise<boolean> {
        const supabase = createAdminClient()
        const { error } = await supabase
            .from('instagram_accounts')
            .delete()
            .eq('organization_id', orgId)
        return !error
    }
}

export class SupabaseInstagramAutoConfigRepository implements IInstagramAutoConfigRepository {
    async findByOrgId(orgId: string): Promise<InstagramAutoConfigRow | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('instagram_auto_configs')
            .select('*')
            .eq('organization_id', orgId)
            .single()
        return data as InstagramAutoConfigRow | null
    }

    async upsert(orgId: string, data: Partial<Omit<InstagramAutoConfigRow, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>): Promise<InstagramAutoConfigRow | null> {
        const supabase = createAdminClient()
        const { data: row } = await supabase
            .from('instagram_auto_configs')
            .upsert({
                organization_id: orgId,
                ...data,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'organization_id' })
            .select()
            .single()
        return row as InstagramAutoConfigRow | null
    }

    async toggleActive(orgId: string, active: boolean): Promise<boolean> {
        const supabase = createAdminClient()
        const { error } = await supabase
            .from('instagram_auto_configs')
            .update({ active, updated_at: new Date().toISOString() })
            .eq('organization_id', orgId)
        return !error
    }
}

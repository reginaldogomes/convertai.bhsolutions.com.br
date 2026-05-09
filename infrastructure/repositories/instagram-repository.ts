import { createAdminClient } from '@/lib/supabase/admin'
import { InstagramContent } from '@/domain/entities/instagram-content'
import type {
    IInstagramContentRepository,
    IInstagramAccountRepository,
    IInstagramAutoConfigRepository,
    CreateInstagramContentInput,
    UpdateInstagramContentInput,
} from '@/domain/interfaces/instagram-repository'
import type { InstagramContentRow, InstagramContentStatus, InstagramAccountRow, InstagramAutoConfigRow, InstagramMetricsJson } from '@/types/instagram'

// ─── Content Repository ───────────────────────────────────────────────────────

export class SupabaseInstagramContentRepository implements IInstagramContentRepository {
    async findById(id: string): Promise<InstagramContent | null> {
        const { data } = await createAdminClient()
            .from('instagram_contents')
            .select('*')
            .eq('id', id)
            .single()
        return data ? InstagramContent.fromRow(data) : null
    }

    async findByOrgId(orgId: string): Promise<InstagramContentRow[]> {
        const { data } = await createAdminClient()
            .from('instagram_contents')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
        return (data ?? []) as unknown as InstagramContentRow[]
    }

    /** Returns all posts in 'scheduled' status whose scheduled_at is in the past. */
    async findScheduledDue(): Promise<InstagramContentRow[]> {
        const { data } = await createAdminClient()
            .from('instagram_contents')
            .select('*')
            .eq('status', 'scheduled')
            .lte('scheduled_at', new Date().toISOString())
        return (data ?? []) as unknown as InstagramContentRow[]
    }

    /** Returns published posts with an ig_post_id for metrics sync. */
    async findPublishedForMetrics(sinceHours = 168): Promise<InstagramContentRow[]> {
        const since = new Date(Date.now() - sinceHours * 3_600_000).toISOString()
        const { data } = await createAdminClient()
            .from('instagram_contents')
            .select('*')
            .eq('status', 'published')
            .not('ig_post_id', 'is', null)
            .gte('published_at', since)
        return (data ?? []) as unknown as InstagramContentRow[]
    }

    async create(input: CreateInstagramContentInput): Promise<InstagramContent | null> {
        const { data } = await createAdminClient()
            .from('instagram_contents')
            .insert({
                organization_id: input.organizationId,
                type: input.type,
                caption: input.caption,
                media_urls: input.mediaUrls,
                thumbnail_url: input.thumbnailUrl ?? null,
                hashtags: input.hashtags ?? [],
                scheduled_at: input.scheduledAt ?? null,
                status: input.scheduledAt ? 'scheduled' : 'draft',
            })
            .select()
            .single()
        return data ? InstagramContent.fromRow(data) : null
    }

    async update(id: string, orgId: string, input: UpdateInstagramContentInput): Promise<InstagramContent | null> {
        const patch: Record<string, unknown> = {}
        if (input.caption !== undefined) patch.caption = input.caption
        if (input.mediaUrls !== undefined) patch.media_urls = input.mediaUrls
        if (input.thumbnailUrl !== undefined) patch.thumbnail_url = input.thumbnailUrl
        if (input.hashtags !== undefined) patch.hashtags = input.hashtags
        if (input.type !== undefined) patch.type = input.type
        if (input.scheduledAt !== undefined) {
            patch.scheduled_at = input.scheduledAt
            patch.status = input.scheduledAt ? 'scheduled' : 'draft'
        }

        const { data } = await createAdminClient()
            .from('instagram_contents')
            .update(patch)
            .eq('id', id)
            .eq('organization_id', orgId)
            .in('status', ['draft', 'scheduled', 'failed'])
            .select()
            .single()
        return data ? InstagramContent.fromRow(data) : null
    }

    async updateStatus(id: string, orgId: string, status: InstagramContentStatus, extra?: Record<string, unknown>): Promise<boolean> {
        const patch: Record<string, unknown> = { status }
        if (status === 'published') patch.published_at = new Date().toISOString()
        if (extra) Object.assign(patch, extra)

        const { error } = await createAdminClient()
            .from('instagram_contents')
            .update(patch)
            .eq('id', id)
            .eq('organization_id', orgId)
        return !error
    }

    async updateMetrics(id: string, metrics: InstagramMetricsJson): Promise<boolean> {
        const { error } = await createAdminClient()
            .from('instagram_contents')
            .update({ metrics, metrics_synced_at: new Date().toISOString() })
            .eq('id', id)
        return !error
    }

    async delete(id: string, orgId: string): Promise<boolean> {
        const { error } = await createAdminClient()
            .from('instagram_contents')
            .delete()
            .eq('id', id)
            .eq('organization_id', orgId)
            .in('status', ['draft', 'scheduled', 'failed'])
        return !error
    }

    async countByOrgId(orgId: string): Promise<number> {
        const { count } = await createAdminClient()
            .from('instagram_contents')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId)
        return count ?? 0
    }
}

// ─── Account Repository ───────────────────────────────────────────────────────

export class SupabaseInstagramAccountRepository implements IInstagramAccountRepository {
    async findByOrgId(orgId: string): Promise<InstagramAccountRow | null> {
        const { data } = await createAdminClient()
            .from('instagram_accounts')
            .select('*')
            .eq('organization_id', orgId)
            .single()
        return data as InstagramAccountRow | null
    }

    /** Finds accounts whose token expires within `daysThreshold` days. */
    async findAllExpiringSoon(daysThreshold = 15): Promise<InstagramAccountRow[]> {
        const cutoff = new Date(Date.now() + daysThreshold * 86_400_000).toISOString()
        const { data } = await createAdminClient()
            .from('instagram_accounts')
            .select('*')
            .lte('token_expires_at', cutoff)
        return (data ?? []) as unknown as InstagramAccountRow[]
    }

    async upsert(orgId: string, data: Omit<InstagramAccountRow, 'id' | 'organization_id' | 'connected_at'>): Promise<boolean> {
        const { error } = await createAdminClient()
            .from('instagram_accounts')
            .upsert({ organization_id: orgId, ...data }, { onConflict: 'organization_id' })
        return !error
    }

    async updateToken(orgId: string, token: string, expiresAt: string): Promise<boolean> {
        const { error } = await createAdminClient()
            .from('instagram_accounts')
            .update({
                access_token: token,
                token_expires_at: expiresAt,
                token_refreshed_at: new Date().toISOString(),
            })
            .eq('organization_id', orgId)
        return !error
    }

    async delete(orgId: string): Promise<boolean> {
        const { error } = await createAdminClient()
            .from('instagram_accounts')
            .delete()
            .eq('organization_id', orgId)
        return !error
    }
}

// ─── Auto-Config Repository ───────────────────────────────────────────────────

export class SupabaseInstagramAutoConfigRepository implements IInstagramAutoConfigRepository {
    async findByOrgId(orgId: string): Promise<InstagramAutoConfigRow | null> {
        const { data } = await createAdminClient()
            .from('instagram_auto_configs')
            .select('*')
            .eq('organization_id', orgId)
            .single()
        return data as InstagramAutoConfigRow | null
    }

    async upsert(orgId: string, data: Partial<Omit<InstagramAutoConfigRow, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>): Promise<InstagramAutoConfigRow | null> {
        const { data: row } = await createAdminClient()
            .from('instagram_auto_configs')
            .upsert({ organization_id: orgId, ...data, updated_at: new Date().toISOString() }, { onConflict: 'organization_id' })
            .select()
            .single()
        return row as InstagramAutoConfigRow | null
    }

    async toggleActive(orgId: string, active: boolean): Promise<boolean> {
        const { error } = await createAdminClient()
            .from('instagram_auto_configs')
            .update({ active, updated_at: new Date().toISOString() })
            .eq('organization_id', orgId)
        return !error
    }
}

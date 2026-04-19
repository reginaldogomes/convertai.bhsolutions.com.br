import { createAdminClient } from '@/lib/supabase/admin'
import { Site } from '@/domain/entities/site'
import type { ISiteRepository, CreateSiteInput } from '@/domain/interfaces'
import type { DatabaseRow } from '@/types/database'

export class SupabaseSiteRepository implements ISiteRepository {
    async listByOrg(orgId: string): Promise<Site[]> {
        const admin = createAdminClient()
        const { data, error } = await admin
            .from('sites')
            .select('id, organization_id, name, created_at, updated_at')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[SupabaseSiteRepository] Error listing sites:', error)
            throw new Error(`Failed to list sites for org ${orgId}`)
        }

        return (data ?? []).map(row => Site.fromRow(row as DatabaseRow<'sites'>))
    }

    async create(orgId: string, input: CreateSiteInput): Promise<Site> {
        const admin = createAdminClient()
        const { data, error } = await admin
            .from('sites')
            .insert({
                organization_id: orgId,
                name: input.name,
            })
            .select()
            .single()

        if (error || !data) {
            console.error('[SupabaseSiteRepository] Error creating site:', error)
            throw new Error('Failed to create site.')
        }

        return Site.fromRow(data as DatabaseRow<'sites'>)
    }
}

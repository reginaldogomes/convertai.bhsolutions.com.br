import { createAdminClient } from '@/lib/supabase/admin'
import { Site } from '@/domain/entities/site'
import { DomainError } from '@/domain/errors'
import type { ISiteRepository, CreateSiteInput, UpdateSiteInput } from '@/domain/interfaces'
import type { DatabaseRow } from '@/types/database'

const SELECT_COLS = 'id, organization_id, name, slug, config_json, primary_color, logo_url, description, theme, status, created_at, updated_at'

export class SupabaseSiteRepository implements ISiteRepository {
    async listByOrg(orgId: string): Promise<Site[]> {
        const admin = createAdminClient()
        const { data, error } = await admin
            .from('sites')
            .select(SELECT_COLS)
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[SupabaseSiteRepository] Error listing sites:', error.message)
            throw new DomainError('UNKNOWN', `Erro inesperado ao listar sites para a organização ${orgId}.`)
        }

        return (data ?? []).map(row => Site.fromRow(row as DatabaseRow<'sites'>))
    }

    async getById(id: string, orgId: string): Promise<Site | null> {
        if (!id || id === 'undefined') {
            throw new DomainError('VALIDATION_ERROR', 'ID do site inválido.')
        }

        const admin = createAdminClient()
        const { data, error } = await admin
            .from('sites')
            .select(SELECT_COLS)
            .eq('id', id)
            .eq('organization_id', orgId)
            .single()

        if (error) {
            if (error.code === 'PGRST116') return null
            console.error('[SupabaseSiteRepository] Error getting site:', error.message)
            throw new DomainError('UNKNOWN', `Erro inesperado ao buscar site ${id}.`)
        }

        return data ? Site.fromRow(data as DatabaseRow<'sites'>) : null
    }

    async findBySlug(slug: string): Promise<Site | null> {
        const admin = createAdminClient()
        const { data, error } = await admin
            .from('sites')
            .select(SELECT_COLS)
            .eq('slug', slug)
            .single()

        if (error) {
            if (error.code === 'PGRST116') return null
            console.error('[SupabaseSiteRepository] Error finding site by slug:', error.message)
            throw new DomainError('UNKNOWN', `Erro ao buscar site pelo slug "${slug}".`)
        }

        return data ? Site.fromRow(data as DatabaseRow<'sites'>) : null
    }

    async create(orgId: string, input: CreateSiteInput): Promise<Site> {
        const admin = createAdminClient()
        const { data, error } = await admin
            .from('sites')
            .insert({
                organization_id: orgId,
                name: input.name,
                slug: input.slug,
                config_json: input.configJson ?? {},
                primary_color: input.primaryColor,
                logo_url: input.logoUrl,
                description: input.description,
                theme: input.theme ?? 'dark',
                status: input.status ?? 'draft',
            })
            .select(SELECT_COLS)
            .single()

        if (error || !data) {
            console.error('[SupabaseSiteRepository] Error creating site:', error?.message ?? 'No data returned.')
            if (error?.code === '23505') {
                throw new DomainError('CONFLICT', 'Já existe um site com este slug. Tente um nome diferente.')
            }
            throw new DomainError('UNKNOWN', 'Não foi possível criar o site. Verifique os logs do servidor.')
        }

        return Site.fromRow(data as DatabaseRow<'sites'>)
    }

    async update(id: string, orgId: string, input: UpdateSiteInput): Promise<Site> {
        const admin = createAdminClient()

        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (input.name !== undefined) updateData.name = input.name
        if (input.slug !== undefined) updateData.slug = input.slug
        if (input.configJson !== undefined) updateData.config_json = input.configJson
        if (input.primaryColor !== undefined) updateData.primary_color = input.primaryColor
        if (input.logoUrl !== undefined) updateData.logo_url = input.logoUrl
        if (input.description !== undefined) updateData.description = input.description
        if (input.theme !== undefined) updateData.theme = input.theme
        if (input.status !== undefined) updateData.status = input.status

        const { data, error } = await admin
            .from('sites')
            .update(updateData)
            .eq('id', id)
            .eq('organization_id', orgId)
            .select(SELECT_COLS)
            .single()

        if (error || !data) {
            console.error('[SupabaseSiteRepository] Error updating site:', error?.message ?? 'No data returned.')
            if (error?.code === '23505') {
                throw new DomainError('CONFLICT', 'Já existe um site com este slug.')
            }
            throw new DomainError('UNKNOWN', 'Não foi possível atualizar o site.')
        }

        return Site.fromRow(data as DatabaseRow<'sites'>)
    }

    async delete(id: string, orgId: string): Promise<void> {
        const admin = createAdminClient()
        const { error } = await admin
            .from('sites')
            .delete()
            .eq('id', id)
            .eq('organization_id', orgId)

        if (error) {
            console.error('[SupabaseSiteRepository] Error deleting site:', error.message)
            throw new DomainError('UNKNOWN', 'Não foi possível deletar o site.')
        }
    }
}

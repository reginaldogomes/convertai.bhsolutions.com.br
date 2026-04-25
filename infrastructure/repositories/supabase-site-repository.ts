import { createAdminClient } from '@/lib/supabase/admin'
import { Site } from '@/domain/entities/site'
import { DomainError } from '@/domain/errors'
import type { ISiteRepository, CreateSiteInput, UpdateSiteInput } from '@/domain/interfaces'
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
            console.error('[SupabaseSiteRepository] Error listing sites:', error.message)
            if (error.message.includes('network') || error.message.includes('fetch')) {
                throw new DomainError('EXTERNAL_SERVICE', 'Falha de comunicação com o banco de dados ao listar sites.')
            }
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
            .select('id, organization_id, name, created_at, updated_at')
            .eq('id', id)
            .eq('organization_id', orgId)
            .single()

        if (error) {
            if (error.code === 'PGRST116') { // not found
                return null
            }
            console.error('[SupabaseSiteRepository] Error getting site:', error.message)
            if (error.message.includes('network') || error.message.includes('fetch')) {
                throw new DomainError('EXTERNAL_SERVICE', 'Falha de comunicação com o banco de dados ao buscar site.')
            }
            throw new DomainError('UNKNOWN', `Erro inesperado ao buscar site ${id}.`)
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
            })
            .select()
            .single()

        if (error || !data) {
            console.error('[SupabaseSiteRepository] Error creating site:', error?.message ?? 'No data returned.')
            if (error) {
                if (error.code === '23505') {
                    throw new DomainError('CONFLICT', 'Já existe um site com este nome na sua organização.')
                }
                if (error.message.includes('network') || error.message.includes('fetch')) {
                    throw new DomainError('EXTERNAL_SERVICE', 'Falha de comunicação com o banco de dados ao criar o site.')
                }
            }
            throw new DomainError('UNKNOWN', 'Não foi possível criar o site. Verifique os logs do servidor.')
        }

        return Site.fromRow(data as DatabaseRow<'sites'>)
    }

    async update(id: string, orgId: string, input: UpdateSiteInput): Promise<Site> {
        const admin = createAdminClient()
        
        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (input.name !== undefined) {
            updateData.name = input.name
        }

        const { data, error } = await admin
            .from('sites')
            .update(updateData)
            .eq('id', id)
            .eq('organization_id', orgId)
            .select()
            .single()

        if (error || !data) {
            console.error('[SupabaseSiteRepository] Error updating site:', error?.message ?? 'No data returned.')
            if (error) {
                if (error.code === '23505') {
                    throw new DomainError('CONFLICT', 'Já existe um site com este nome na sua organização.')
                }
                if (error.message.includes('network') || error.message.includes('fetch')) {
                    throw new DomainError('EXTERNAL_SERVICE', 'Falha de comunicação com o banco de dados ao atualizar site.')
                }
            }
            throw new DomainError('UNKNOWN', 'Não foi possível atualizar o site. Verifique os logs do servidor.')
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
            if (error.message.includes('network') || error.message.includes('fetch')) {
                throw new DomainError('EXTERNAL_SERVICE', 'Falha de comunicação com o banco de dados ao deletar site.')
            }
            throw new DomainError('UNKNOWN', 'Não foi possível deletar o site. Verifique os logs do servidor.')
        }
    }
}
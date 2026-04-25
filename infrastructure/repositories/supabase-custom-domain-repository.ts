import { createAdminClient } from '@/lib/supabase/admin'
import { CustomDomain } from '@/domain/entities/custom-domain'
import { DomainError } from '@/domain/errors'
import type { ICustomDomainRepository, CreateCustomDomainInput, UpdateCustomDomainInput } from '@/domain/interfaces'
import type { DatabaseRow } from '@/types/database'

export class SupabaseCustomDomainRepository implements ICustomDomainRepository {
    async listByOrg(orgId: string): Promise<CustomDomain[]> {
        const admin = createAdminClient()
        const { data, error } = await admin
            .from('custom_domains')
            .select('id, organization_id, domain, status, target_page_id, created_at, updated_at')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[SupabaseCustomDomainRepository] Error listing domains:', error.message)
            if (error.message.includes('network') || error.message.includes('fetch')) {
                throw new DomainError('EXTERNAL_SERVICE', 'Falha de comunicação ao listar domínios personalizados.')
            }
            throw new DomainError('UNKNOWN', `Erro ao listar domínios personalizados.`)
        }

        return (data ?? []).map(row => CustomDomain.fromRow(row as DatabaseRow<'custom_domains'>))
    }

    async getById(id: string, orgId: string): Promise<CustomDomain | null> {
        const admin = createAdminClient()
        const { data, error } = await admin
            .from('custom_domains')
            .select('id, organization_id, domain, status, target_page_id, created_at, updated_at')
            .eq('id', id)
            .eq('organization_id', orgId)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return null
            }
            console.error('[SupabaseCustomDomainRepository] Error getting domain:', error.message)
            if (error.message.includes('network') || error.message.includes('fetch')) {
                throw new DomainError('EXTERNAL_SERVICE', 'Falha ao buscar domínio personalizado.')
            }
            throw new DomainError('UNKNOWN', `Erro ao buscar domínio.`)
        }

        return data ? CustomDomain.fromRow(data as DatabaseRow<'custom_domains'>) : null
    }

    async getByDomain(domain: string, orgId: string): Promise<CustomDomain | null> {
        const admin = createAdminClient()
        const { data, error } = await admin
            .from('custom_domains')
            .select('id, organization_id, domain, status, target_page_id, created_at, updated_at')
            .eq('domain', domain.toLowerCase())
            .eq('organization_id', orgId)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return null
            }
            console.error('[SupabaseCustomDomainRepository] Error getting domain by name:', error.message)
            if (error.message.includes('network') || error.message.includes('fetch')) {
                throw new DomainError('EXTERNAL_SERVICE', 'Falha ao buscar domínio.')
            }
            throw new DomainError('UNKNOWN', `Erro ao buscar domínio.`)
        }

        return data ? CustomDomain.fromRow(data as DatabaseRow<'custom_domains'>) : null
    }

    async create(orgId: string, input: CreateCustomDomainInput): Promise<CustomDomain> {
        const admin = createAdminClient()
        const { data, error } = await admin
            .from('custom_domains')
            .insert({
                organization_id: orgId,
                domain: input.domain.toLowerCase(),
                target_page_id: input.targetPageId || null,
                status: 'pending',
            })
            .select()
            .single()

        if (error || !data) {
            console.error('[SupabaseCustomDomainRepository] Error creating domain:', error?.message ?? 'No data returned.')
            if (error) {
                if (error.code === '23505') {
                    throw new DomainError('CONFLICT', 'Este domínio já está em uso.')
                }
                if (error.message.includes('network') || error.message.includes('fetch')) {
                    throw new DomainError('EXTERNAL_SERVICE', 'Falha ao criar domínio personalizado.')
                }
            }
            throw new DomainError('UNKNOWN', 'Não foi possível adicionar o domínio.')
        }

        return CustomDomain.fromRow(data as DatabaseRow<'custom_domains'>)
    }

    async update(id: string, orgId: string, input: UpdateCustomDomainInput): Promise<CustomDomain> {
        const admin = createAdminClient()

        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (input.status !== undefined) {
            updateData.status = input.status
        }
        if (input.targetPageId !== undefined) {
            updateData.target_page_id = input.targetPageId
        }

        const { data, error } = await admin
            .from('custom_domains')
            .update(updateData)
            .eq('id', id)
            .eq('organization_id', orgId)
            .select()
            .single()

        if (error || !data) {
            console.error('[SupabaseCustomDomainRepository] Error updating domain:', error?.message ?? 'No data returned.')
            if (error) {
                if (error.message.includes('network') || error.message.includes('fetch')) {
                    throw new DomainError('EXTERNAL_SERVICE', 'Falha ao atualizar domínio.')
                }
            }
            throw new DomainError('UNKNOWN', 'Não foi possível atualizar o domínio.')
        }

        return CustomDomain.fromRow(data as DatabaseRow<'custom_domains'>)
    }

    async delete(id: string, orgId: string): Promise<void> {
        const admin = createAdminClient()
        const { error } = await admin
            .from('custom_domains')
            .delete()
            .eq('id', id)
            .eq('organization_id', orgId)

        if (error) {
            console.error('[SupabaseCustomDomainRepository] Error deleting domain:', error.message)
            if (error.message.includes('network') || error.message.includes('fetch')) {
                throw new DomainError('EXTERNAL_SERVICE', 'Falha ao deletar domínio.')
            }
            throw new DomainError('UNKNOWN', 'Não foi possível deletar o domínio.')
        }
    }
}

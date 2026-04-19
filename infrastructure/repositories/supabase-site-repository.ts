import { createAdminClient } from '@/lib/supabase/admin'
import { Site } from '@/domain/entities/site'
import { DomainError } from '@/domain/errors'
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
            console.error('[SupabaseSiteRepository] Error listing sites:', error.message)
            // Classifica o erro para a camada de aplicação.
            if (error.message.includes('network') || error.message.includes('fetch')) {
                throw new DomainError('EXTERNAL_SERVICE', 'Falha de comunicação com o banco de dados ao listar sites.')
            }
            throw new DomainError('UNKNOWN', `Erro inesperado ao listar sites para a organização ${orgId}.`)
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
            console.error('[SupabaseSiteRepository] Error creating site:', error?.message ?? 'No data returned.')
            if (error) {
                // Trata a violação de chave única (organization_id, name)
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
}
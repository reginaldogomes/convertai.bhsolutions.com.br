import { createAdminClient } from '@/lib/supabase/admin'
import { Contact } from '@/domain/entities'
import type { IContactRepository, CreateContactInput } from '@/domain/interfaces'

export class SupabaseContactRepository implements IContactRepository {
    async findById(id: string): Promise<Contact | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', id)
            .single()
        return data ? Contact.fromRow(data) : null
    }

    async findByPhone(phone: string, orgId: string): Promise<Contact | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('contacts')
            .select('*')
            .eq('organization_id', orgId)
            .eq('phone', phone)
            .limit(1)
            .maybeSingle()
        return data ? Contact.fromRow(data) : null
    }

    async findByOrgId(orgId: string): Promise<Contact[]> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('contacts')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
        return (data ?? []).map(Contact.fromRow)
    }

    async findIdAndNameByOrgId(orgId: string): Promise<{ id: string; name: string }[]> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('contacts')
            .select('id, name')
            .eq('organization_id', orgId)
            .order('name')
        return data ?? []
    }

    async findWithEmailByOrgId(orgId: string, tags?: string[]): Promise<{ id: string; name: string; email: string }[]> {
        const supabase = createAdminClient()
        let query = supabase
            .from('contacts')
            .select('id, name, email')
            .eq('organization_id', orgId)
            .not('email', 'is', null)

        if (tags && tags.length > 0) {
            query = query.overlaps('tags', tags)
        }

        const { data } = await query.order('name')
        return (data ?? []).filter((c): c is { id: string; name: string; email: string } => c.email !== null)
    }

    async create(input: CreateContactInput): Promise<Contact | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('contacts')
            .insert({
                organization_id: input.organizationId,
                name: input.name,
                email: input.email,
                phone: input.phone,
                company: input.company,
                tags: input.tags,
                notes: input.notes,
            })
            .select()
            .single()
        return data ? Contact.fromRow(data) : null
    }

    async countRecentByOrgId(orgId: string, since: string): Promise<number> {
        const supabase = createAdminClient()
        const { count } = await supabase
            .from('contacts')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .gte('created_at', since)
        return count ?? 0
    }
}

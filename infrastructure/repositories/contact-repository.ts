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

    async findByEmail(email: string, orgId: string): Promise<Contact | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('contacts')
            .select('*')
            .eq('organization_id', orgId)
            .eq('email', email)
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

    async findWithPhoneByOrgId(orgId: string, tags?: string[]): Promise<{ id: string; name: string; phone: string }[]> {
        const supabase = createAdminClient()
        let query = supabase
            .from('contacts')
            .select('id, name, phone')
            .eq('organization_id', orgId)
            .not('phone', 'is', null)

        if (tags && tags.length > 0) {
            query = query.overlaps('tags', tags)
        }

        const { data } = await query.order('name')
        return (data ?? []).filter((c): c is { id: string; name: string; phone: string } => c.phone !== null)
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

    async update(id: string, input: Partial<Omit<import('@/domain/interfaces').CreateContactInput, 'organizationId'>>): Promise<void> {
        const supabase = createAdminClient()
        const patch: Record<string, unknown> = {}
        if (input.name !== undefined) patch.name = input.name
        if (input.email !== undefined) patch.email = input.email
        if (input.phone !== undefined) patch.phone = input.phone
        if (input.company !== undefined) patch.company = input.company
        if (input.tags !== undefined) patch.tags = input.tags
        if (input.notes !== undefined) patch.notes = input.notes
        if (Object.keys(patch).length > 0) {
            await supabase.from('contacts').update(patch).eq('id', id)
        }
    }

    async delete(id: string, orgId: string): Promise<void> {
        const supabase = createAdminClient()
        await supabase
            .from('contacts')
            .delete()
            .eq('id', id)
            .eq('organization_id', orgId)
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

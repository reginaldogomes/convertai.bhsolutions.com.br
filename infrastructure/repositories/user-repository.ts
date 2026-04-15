import { createAdminClient } from '@/lib/supabase/admin'
import type { IUserRepository, UserProfile, OrganizationDetails } from '@/domain/interfaces'
import { OrgMember } from '@/domain/entities/org-member'
import type { UserRole } from '@/types/database'

export class SupabaseUserRepository implements IUserRepository {
    async findProfileByUserId(userId: string): Promise<UserProfile | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('users')
            .select('id, organization_id, name, email, role')
            .eq('id', userId)
            .single()
        if (!data) return null
        return {
            id: data.id,
            organizationId: data.organization_id,
            name: data.name,
            email: data.email,
            role: data.role,
        }
    }

    async findProfileWithOrgByUserId(userId: string) {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('users')
            .select('id, organization_id, name, email, role, organizations(id, name, email, phone, website, address, city, state, zip_code, country, logo_url, description)')
            .eq('id', userId)
            .single()
        if (!data) return null
        const org = data.organizations as unknown as {
            id: string; name: string; email: string | null; phone: string | null
            website: string | null; address: string | null; city: string | null
            state: string | null; zip_code: string | null; country: string | null
            logo_url: string | null; description: string | null
        }
        return {
            id: data.id,
            organizationId: data.organization_id,
            name: data.name,
            email: data.email,
            role: data.role,
            orgId: org?.id ?? data.organization_id,
            orgName: org?.name ?? '',
            orgEmail: org?.email ?? null,
            orgPhone: org?.phone ?? null,
            orgWebsite: org?.website ?? null,
            orgAddress: org?.address ?? null,
            orgCity: org?.city ?? null,
            orgState: org?.state ?? null,
            orgZipCode: org?.zip_code ?? null,
            orgCountry: org?.country ?? null,
            orgLogoUrl: org?.logo_url ?? null,
            orgDescription: org?.description ?? null,
        }
    }

    async updateOrganization(orgId: string, data: Partial<Omit<OrganizationDetails, 'orgId'>>): Promise<void> {
        const supabase = createAdminClient()
        const mapped: Record<string, unknown> = {}
        if (data.orgName !== undefined) mapped.name = data.orgName
        if (data.orgEmail !== undefined) mapped.email = data.orgEmail
        if (data.orgPhone !== undefined) mapped.phone = data.orgPhone
        if (data.orgWebsite !== undefined) mapped.website = data.orgWebsite
        if (data.orgAddress !== undefined) mapped.address = data.orgAddress
        if (data.orgCity !== undefined) mapped.city = data.orgCity
        if (data.orgState !== undefined) mapped.state = data.orgState
        if (data.orgZipCode !== undefined) mapped.zip_code = data.orgZipCode
        if (data.orgCountry !== undefined) mapped.country = data.orgCountry
        if (data.orgLogoUrl !== undefined) mapped.logo_url = data.orgLogoUrl
        if (data.orgDescription !== undefined) mapped.description = data.orgDescription
        await supabase.from('organizations').update(mapped).eq('id', orgId)
    }

    // ─── Gestão de membros ────────────────────────────────────────────────────

    async findMembersByOrgId(orgId: string): Promise<OrgMember[]> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('users')
            .select('id, organization_id, name, email, role, avatar_url, created_at')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: true })
        if (error) throw error
        return (data ?? []).map(OrgMember.fromRow)
    }

    async countMembersByOrgId(orgId: string): Promise<number> {
        const supabase = createAdminClient()
        const { count, error } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId)
        if (error) throw error
        return count ?? 0
    }

    async updateMemberRole(orgId: string, userId: string, role: UserRole): Promise<void> {
        const supabase = createAdminClient()
        const { error } = await supabase
            .from('users')
            .update({ role })
            .eq('id', userId)
            .eq('organization_id', orgId)
        if (error) throw error
    }

    async removeMember(orgId: string, userId: string): Promise<void> {
        const supabase = createAdminClient()
        // Remove da tabela public.users
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId)
            .eq('organization_id', orgId)
        if (error) throw error
        // Remove o usuário do Supabase Auth completamente
        await supabase.auth.admin.deleteUser(userId)
    }

    async inviteMember(orgId: string, email: string, name: string, role: UserRole): Promise<void> {
        const supabase = createAdminClient()
        // inviteUserByEmail envia email com magic link e cria em auth.users
        // user_metadata será lido pelo callback para provisionar na org correta
        const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
            data: {
                invited_org_id: orgId,
                invited_role: role,
                full_name: name,
            },
        })
        if (error) throw error
    }
}

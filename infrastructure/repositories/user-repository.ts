import { createAdminClient } from '@/lib/supabase/admin'
import type { IUserRepository, UserProfile, OrganizationDetails } from '@/domain/interfaces'

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
}

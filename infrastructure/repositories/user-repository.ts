import { createAdminClient } from '@/lib/supabase/admin'
import type { IUserRepository, UserProfile } from '@/domain/interfaces'

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
            .select('id, organization_id, name, email, role, organizations(id, name, plan)')
            .eq('id', userId)
            .single()
        if (!data) return null
        const org = data.organizations as unknown as { id: string; name: string; plan: string }
        return {
            id: data.id,
            organizationId: data.organization_id,
            name: data.name,
            email: data.email,
            role: data.role,
            orgId: org?.id ?? data.organization_id,
            orgName: org?.name ?? '',
            orgPlan: org?.plan ?? 'free',
        }
    }
}

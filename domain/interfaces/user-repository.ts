import type { OrgMember } from '@/domain/entities/org-member'
import type { UserRole } from '@/types/database'

export interface UserProfile {
    id: string
    organizationId: string
    name: string
    email: string
    role: string
}

export interface OrganizationDetails {
    orgId: string
    orgName: string
    orgEmail: string | null
    orgPhone: string | null
    orgWebsite: string | null
    orgAddress: string | null
    orgCity: string | null
    orgState: string | null
    orgZipCode: string | null
    orgCountry: string | null
    orgLogoUrl: string | null
    orgDescription: string | null
}

export interface IUserRepository {
    findProfileByUserId(userId: string): Promise<UserProfile | null>
    findProfileWithOrgByUserId(userId: string): Promise<(UserProfile & OrganizationDetails) | null>
    updateOrganization(orgId: string, data: Partial<Omit<OrganizationDetails, 'orgId'>>): Promise<void>

    // Gestão de membros da organização
    findMembersByOrgId(orgId: string): Promise<OrgMember[]>
    countMembersByOrgId(orgId: string): Promise<number>
    updateMemberRole(orgId: string, userId: string, role: UserRole): Promise<void>
    removeMember(orgId: string, userId: string): Promise<void>
    inviteMember(orgId: string, email: string, name: string, role: UserRole): Promise<void>
}

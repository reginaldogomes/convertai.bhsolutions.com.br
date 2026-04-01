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
}

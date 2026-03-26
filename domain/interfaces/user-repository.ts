export interface UserProfile {
    id: string
    organizationId: string
    name: string
    email: string
    role: string
}

export interface IUserRepository {
    findProfileByUserId(userId: string): Promise<UserProfile | null>
    findProfileWithOrgByUserId(userId: string): Promise<(UserProfile & { orgName: string; orgPlan: string; orgId: string }) | null>
}

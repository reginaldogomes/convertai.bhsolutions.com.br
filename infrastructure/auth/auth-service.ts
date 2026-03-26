import { createClient } from '@/lib/supabase/server'
import { NotAuthenticatedError, OrganizationNotFoundError } from '@/domain/errors'
import type { UserProfile } from '@/domain/interfaces'
import { SupabaseUserRepository } from '@/infrastructure/repositories'

const userRepo = new SupabaseUserRepository()

export interface AuthenticatedContext {
    userId: string
    orgId: string
    profile: UserProfile
}

/**
 * Resolves the current authenticated user and their organization.
 * Centralizes the auth + org lookup that was repeated across every page and action.
 */
export async function getAuthContext(): Promise<AuthenticatedContext> {
    const supabase = await createClient()

    let userId: string | undefined
    try {
        const { data } = await supabase.auth.getUser()
        userId = data.user?.id
    } catch {
        throw new NotAuthenticatedError()
    }

    if (!userId) throw new NotAuthenticatedError()

    const profile = await userRepo.findProfileByUserId(userId)
    if (!profile?.organizationId) throw new OrganizationNotFoundError()

    return {
        userId,
        orgId: profile.organizationId,
        profile,
    }
}

/**
 * Same as getAuthContext but returns null instead of throwing.
 * Useful in pages where we want to render empty state instead of error.
 */
export async function tryGetAuthContext(): Promise<AuthenticatedContext | null> {
    try {
        return await getAuthContext()
    } catch {
        return null
    }
}

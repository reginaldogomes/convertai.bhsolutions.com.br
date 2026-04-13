import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { NotAuthenticatedError, OrganizationNotFoundError } from '@/domain/errors'
import type { UserProfile } from '@/domain/interfaces'
import { SupabaseUserRepository } from '@/infrastructure/repositories'

const userRepo = new SupabaseUserRepository()

export interface AuthenticatedContext {
    userId: string
    orgId: string
    profile: UserProfile
    isSuperAdmin: boolean
}

/**
 * Resolves the current authenticated user and their organization.
 * Centralizes the auth + org lookup that was repeated across every page and action.
 * isSuperAdmin is read from app_metadata in the JWT (set via service role only).
 *
 * Wrapped with React.cache() so the Supabase auth network call and profile DB query
 * are deduplicated across multiple callers within the same server request.
 */
export const getAuthContext = cache(async (): Promise<AuthenticatedContext> => {
    const supabase = await createClient()

    let userId: string | undefined
    let isSuperAdmin = false
    try {
        const { data } = await supabase.auth.getUser()
        userId = data.user?.id
        isSuperAdmin = data.user?.app_metadata?.is_super_admin === true
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
        isSuperAdmin,
    }
})

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

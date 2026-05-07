import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Creates a Supabase client with the service_role key (bypasses RLS).
 * Use ONLY in server-side code where auth has already been verified programmatically.
 */
export function hasSupabaseAdminEnv() {
    return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    }

    return createClient<Database>(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}

import { getAuthContext } from '@/infrastructure/auth'
import { redirect } from 'next/navigation'

export const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000001'

export async function requireSuperAdmin() {
    const ctx = await getAuthContext()
    if (!ctx.isSuperAdmin) redirect('/')
    return ctx
}

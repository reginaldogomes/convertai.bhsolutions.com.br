'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { PLATFORM_ORG_ID, requireSuperAdmin } from './utils'
import type { AdminStats, OrgSummary, OrgDetail, AdminUserRow, AdminLandingPageRow } from './types'

export async function getAdminStats(): Promise<AdminStats> {
    await requireSuperAdmin()
    const admin = createAdminClient()

    const { data, error } = await admin.rpc('get_admin_stats').single()

    if (error) {
        console.error('Erro ao buscar estatísticas de admin via RPC. Objeto de erro completo:', JSON.stringify(error, null, 2))
        return {
            total_orgs: 0,
            total_users: 0,
            total_landing_pages: 0,
            mrr_brl: 0,
            active_subscriptions: 0,
            total_credits_balance: 0,
        }
    }

    const stats = data as AdminStats

    return {
        total_orgs: stats.total_orgs ?? 0,
        total_users: stats.total_users ?? 0,
        total_landing_pages: stats.total_landing_pages ?? 0,
        mrr_brl: stats.mrr_brl ?? 0,
        active_subscriptions: stats.active_subscriptions ?? 0,
        total_credits_balance: stats.total_credits_balance ?? 0,
    }
}

export async function listAllOrganizations(): Promise<OrgSummary[]> {
    await requireSuperAdmin()
    const admin = createAdminClient()

    const { data, error } = await admin.rpc('get_all_organizations_summary')

    if (error) {
        console.error('Erro ao buscar resumo de organizações via RPC:', { message: error.message, code: error.code })
        return []
    }

    return (data as OrgSummary[]) ?? []
}

export async function getOrganizationDetail(orgId: string) {
    await requireSuperAdmin()
    const admin = createAdminClient()

    const [{ data: org }, { data: users }, { data: pages }] = await Promise.all([
        admin.from('organizations').select('id, name, created_at').eq('id', orgId).single(),
        admin
            .from('users')
            .select('id, name, email, role, created_at')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false }),
        admin
            .from('landing_pages')
            .select('id, name, slug, status, created_at')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false }),
    ])

    return {
        org: org as OrgDetail | null,
        users: users ?? [],
        pages: pages ?? [],
    }
}

export async function listAllUsers(): Promise<AdminUserRow[]> {
    await requireSuperAdmin()
    const admin = createAdminClient()

    const { data } = await admin
        .from('users')
        .select('id, name, email, role, created_at, organization_id, organizations(name)')
        .neq('organization_id', PLATFORM_ORG_ID)
        .order('created_at', { ascending: false })

    return (data ?? []).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        created_at: u.created_at,
        org_id: u.organization_id,
        org_name: (u.organizations as { name: string } | null)?.name ?? '—',
    }))
}

export async function listAllLandingPages(): Promise<AdminLandingPageRow[]> {
    await requireSuperAdmin()
    const admin = createAdminClient()

    const { data } = await admin
        .from('landing_pages')
        .select('id, name, slug, status, created_at, organization_id, organizations(name)')
        .order('created_at', { ascending: false })

    return (data ?? []).map(lp => ({
        id: lp.id,
        name: lp.name,
        slug: lp.slug,
        status: lp.status,
        created_at: lp.created_at,
        org_id: lp.organization_id,
        org_name: (lp.organizations as { name: string } | null)?.name ?? '—',
    }))
}

'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthContext } from '@/infrastructure/auth'
import { redirect } from 'next/navigation'

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000001'

async function requireSuperAdmin() {
    const ctx = await getAuthContext()
    if (!ctx.isSuperAdmin) redirect('/')
    return ctx
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrgSummary {
    id: string
    name: string
    plan: string
    created_at: string
    user_count: number
    landing_page_count: number
}

export interface OrgDetail {
    id: string
    name: string
    plan: string
    created_at: string
}

export interface AdminUserRow {
    id: string
    name: string
    email: string
    role: string
    created_at: string
    org_id: string
    org_name: string
}

export interface AdminLandingPageRow {
    id: string
    name: string
    slug: string
    status: string
    created_at: string
    org_id: string
    org_name: string
}

export interface AdminStats {
    total_orgs: number
    total_users: number
    total_landing_pages: number
    orgs_by_plan: Record<string, number>
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
    await requireSuperAdmin()
    const admin = createAdminClient()

    const [{ data: orgs }, { data: users }, { data: lps }] = await Promise.all([
        admin.from('organizations').select('plan').neq('id', PLATFORM_ORG_ID),
        admin.from('users').select('id').neq('organization_id', PLATFORM_ORG_ID),
        admin.from('landing_pages').select('id'),
    ])

    const orgs_by_plan: Record<string, number> = {}
    for (const org of orgs ?? []) {
        orgs_by_plan[org.plan] = (orgs_by_plan[org.plan] ?? 0) + 1
    }

    return {
        total_orgs: orgs?.length ?? 0,
        total_users: users?.length ?? 0,
        total_landing_pages: lps?.length ?? 0,
        orgs_by_plan,
    }
}

export async function listAllOrganizations(): Promise<OrgSummary[]> {
    await requireSuperAdmin()
    const admin = createAdminClient()

    const [{ data: orgs }, { data: userCounts }, { data: lpCounts }] = await Promise.all([
        admin
            .from('organizations')
            .select('id, name, plan, created_at')
            .neq('id', PLATFORM_ORG_ID)
            .order('created_at', { ascending: false }),
        admin.from('users').select('organization_id').neq('organization_id', PLATFORM_ORG_ID),
        admin.from('landing_pages').select('organization_id'),
    ])

    return (orgs ?? []).map(org => ({
        ...org,
        user_count: userCounts?.filter(u => u.organization_id === org.id).length ?? 0,
        landing_page_count: lpCounts?.filter(l => l.organization_id === org.id).length ?? 0,
    }))
}

export async function getOrganizationDetail(orgId: string) {
    await requireSuperAdmin()
    const admin = createAdminClient()

    const [{ data: org }, { data: users }, { data: pages }] = await Promise.all([
        admin.from('organizations').select('id, name, plan, created_at').eq('id', orgId).single(),
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
        org_name: (u.organizations as unknown as { name: string })?.name ?? '—',
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
        org_name: (lp.organizations as unknown as { name: string })?.name ?? '—',
    }))
}

export async function updateOrgPlan(orgId: string, plan: string) {
    await requireSuperAdmin()
    const admin = createAdminClient()
    await admin.from('organizations').update({ plan: plan as 'free' | 'starter' | 'pro' | 'enterprise' }).eq('id', orgId)
}

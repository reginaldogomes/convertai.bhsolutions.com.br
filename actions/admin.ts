'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthContext } from '@/infrastructure/auth'
import { getErrorMessage } from './utils'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

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
    created_at: string
    user_count: number
    landing_page_count: number
}

export interface OrgDetail {
    id: string
    name: string
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
    mrr_brl: number
    active_subscriptions: number
    total_credits_balance: number
}

export interface OrgAdminData {
    subscription: {
        planId: string
        planName: string
        priceBrl: number
        status: string
        currentPeriodEnd: string
    } | null
    creditsBalance: number
}

export interface SuperAdminUser {
    id: string
    email: string
    name: string
    createdAt: string
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
    await requireSuperAdmin()
    const admin = createAdminClient()

    const [{ data: orgs }, { data: users }, { data: lps }, { data: activeSubs }, { data: orgsCredits }] = await Promise.all([
        admin.from('organizations').select('id').neq('id', PLATFORM_ORG_ID),
        admin.from('users').select('id').neq('organization_id', PLATFORM_ORG_ID),
        admin.from('landing_pages').select('id'),
        admin
            .from('organization_subscriptions')
            .select('plan_id, plans(price_brl)')
            .eq('status', 'active')
            .neq('organization_id', PLATFORM_ORG_ID),
        admin.from('organizations').select('credits_balance').neq('id', PLATFORM_ORG_ID),
    ])

    const mrr_brl = (activeSubs ?? []).reduce((sum, sub) => {
        const price = (sub.plans as unknown as { price_brl: number })?.price_brl ?? 0
        return sum + price
    }, 0)

    const total_credits_balance = (orgsCredits ?? []).reduce((sum, o) => sum + (o.credits_balance ?? 0), 0)

    return {
        total_orgs: orgs?.length ?? 0,
        total_users: users?.length ?? 0,
        total_landing_pages: lps?.length ?? 0,
        mrr_brl,
        active_subscriptions: activeSubs?.length ?? 0,
        total_credits_balance,
    }
}

export async function getOrgAdminData(orgId: string): Promise<OrgAdminData> {
    await requireSuperAdmin()
    const admin = createAdminClient()

    const [{ data: sub }, { data: org }] = await Promise.all([
        admin
            .from('organization_subscriptions')
            .select('plan_id, status, current_period_end, plans(name, price_brl)')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        admin.from('organizations').select('credits_balance').eq('id', orgId).single(),
    ])

    return {
        subscription: sub ? {
            planId: sub.plan_id,
            planName: (sub.plans as unknown as { name: string })?.name ?? sub.plan_id,
            priceBrl: (sub.plans as unknown as { price_brl: number })?.price_brl ?? 0,
            status: sub.status,
            currentPeriodEnd: sub.current_period_end,
        } : null,
        creditsBalance: org?.credits_balance ?? 0,
    }
}

export async function listAllOrganizations(): Promise<OrgSummary[]> {
    await requireSuperAdmin()
    const admin = createAdminClient()

    const [{ data: orgs }, { data: userCounts }, { data: lpCounts }] = await Promise.all([
        admin
            .from('organizations')
            .select('id, name, created_at')
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

// ─── Super Admin User Management ──────────────────────────────────────────────

export async function listSuperAdmins(): Promise<SuperAdminUser[]> {
    await requireSuperAdmin()
    const admin = createAdminClient()

    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const saUsers = (authData?.users ?? []).filter(u => u.app_metadata?.is_super_admin === true)

    const ids = saUsers.map(u => u.id)
    const { data: profiles } = ids.length > 0
        ? await admin.from('users').select('id, name').in('id', ids)
        : { data: [] as { id: string; name: string }[] }

    return saUsers.map(u => {
        const profile = (profiles ?? []).find(p => p.id === u.id)
        return {
            id: u.id,
            email: u.email ?? '—',
            name: profile?.name ?? (u.user_metadata?.name as string | undefined) ?? '—',
            createdAt: u.created_at,
        }
    })
}

export async function promoteToSuperAdmin(
    _prevState: { error: string; success: boolean },
    formData: FormData,
): Promise<{ error: string; success: boolean }> {
    try {
        await requireSuperAdmin()
        const email = (formData.get('email') as string | null)?.trim().toLowerCase() ?? ''
        if (!email) return { error: 'E-mail obrigatório.', success: false }

        const admin = createAdminClient()
        const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 })
        const target = authData?.users?.find(u => u.email?.toLowerCase() === email)
        if (!target) return { error: 'Nenhum usuário cadastrado com este e-mail.', success: false }

        if (target.app_metadata?.is_super_admin === true)
            return { error: 'Este usuário já é super admin.', success: false }

        await admin.auth.admin.updateUserById(target.id, {
            app_metadata: { ...target.app_metadata, is_super_admin: true },
        })

        revalidatePath('/admin/admins')
        return { success: true, error: '' }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

export async function demoteFromSuperAdmin(
    _prevState: { error: string; success: boolean },
    formData: FormData,
): Promise<{ error: string; success: boolean }> {
    try {
        const ctx = await requireSuperAdmin()
        const userId = formData.get('userId') as string | null
        if (!userId) return { error: 'ID do usuário obrigatório.', success: false }
        if (userId === ctx.userId)
            return { error: 'Não é possível remover seus próprios privilégios.', success: false }

        const admin = createAdminClient()
        const { data: target } = await admin.auth.admin.getUserById(userId)
        if (!target.user) return { error: 'Usuário não encontrado.', success: false }

        await admin.auth.admin.updateUserById(userId, {
            app_metadata: { ...target.user.app_metadata, is_super_admin: false },
        })

        revalidatePath('/admin/admins')
        return { success: true, error: '' }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

// ─── Precificação & Análise de Custos ─────────────────────────────────────────

// Custo real estimado de cada API (centavos de R$, base 2026)
const REAL_API_COSTS_BRL_CENTS = {
    ai_flash_per_call:    0.30,  // Gemini 2.5 Flash, ~2k chars avg/call
    ai_pro_per_call:      1.50,  // Gemini 2.5 Pro, ~2k chars avg/call
    whatsapp_per_msg:    19.00,  // Twilio BR, business-initiated
    sms_per_msg:         10.00,  // Twilio SMS BR
    email_per_recipient:  0.10,  // Resend (~$0.0008/email converted)
    supabase_per_request: 0.01,  // negligível, base de estimativa
}

export interface CostBreakdownItem {
    operation: string
    creditCharged: number        // créditos cobrados por operação
    creditValueBrl: number       // valor em R$ daqueles créditos (a diferentes preços de plano)
    realCostBrl: number          // custo real da API em centavos R$
    marginPercent: number        // margem em %
}

export interface PlatformCostAnalysis {
    // totais do último mês
    totalAiCostCents: number
    totalCreditConsumed: number
    totalCreditConsumedByType: Record<string, number>
    // precificação por plano
    plans: Array<{
        id: string
        name: string
        priceBrl: number
        monthlyCredits: number
        costPerCreditBrl: number
        estimatedApiCostPerCredit: number
        marginPercent: number
    }>
    // breakdown por tipo de operação
    costBreakdown: CostBreakdownItem[]
    // markup
    markupPercent: number
}

export async function getPlatformCostAnalysis(): Promise<PlatformCostAnalysis> {
    await requireSuperAdmin()
    const admin = createAdminClient()

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Custo real de IA no mês (em cents)
    const { data: aiCosts } = await admin
        .from('ai_usage_log')
        .select('estimated_cost_cents')
        .eq('status', 'success')
        .gte('created_at', startOfMonth.toISOString())
        .neq('organization_id', PLATFORM_ORG_ID)

    const totalAiCostCents = (aiCosts ?? []).reduce((sum, row) => {
        return sum + (Number(row.estimated_cost_cents) || 0)
    }, 0)

    // Créditos consumidos por tipo no mês
    const { data: txData } = await admin
        .from('credit_transactions')
        .select('type, amount')
        .lt('amount', 0)
        .gte('created_at', startOfMonth.toISOString())
        .neq('organization_id', PLATFORM_ORG_ID)

    const totalCreditConsumedByType: Record<string, number> = {}
    let totalCreditConsumed = 0
    for (const tx of txData ?? []) {
        const abs = Math.abs(tx.amount)
        totalCreditConsumedByType[tx.type] = (totalCreditConsumedByType[tx.type] ?? 0) + abs
        totalCreditConsumed += abs
    }

    // Planos via DB
    const { data: plansData } = await admin
        .from('plans')
        .select('id, name, price_brl, monthly_credits')
        .order('sort_order')

    const plans = (plansData ?? []).map(p => {
        const costPerCreditBrl = p.price_brl / p.monthly_credits
        // estimativa de custo real médio de API por crédito
        // baseado em mix: 60% AI Flash (10 cr), 30% WhatsApp (5 cr), 10% email (1 cr)
        const estApiCostPerCredit =
            (0.6 * REAL_API_COSTS_BRL_CENTS.ai_flash_per_call / 10 +
             0.3 * REAL_API_COSTS_BRL_CENTS.whatsapp_per_msg / 5 +
             0.1 * REAL_API_COSTS_BRL_CENTS.email_per_recipient / 1) / 100 // convert cents → R$

        const marginPercent = ((costPerCreditBrl - estApiCostPerCredit) / costPerCreditBrl) * 100

        return {
            id: p.id,
            name: p.name,
            priceBrl: Number(p.price_brl),
            monthlyCredits: p.monthly_credits,
            costPerCreditBrl: Number(costPerCreditBrl.toFixed(4)),
            estimatedApiCostPerCredit: Number(estApiCostPerCredit.toFixed(4)),
            marginPercent: Number(marginPercent.toFixed(1)),
        }
    })

    // Breakdown por tipo de operação
    // Referência: créditos cobrados × valor por plano Starter (cheapest)
    const CREDIT_COSTS_REF = { AI_GENERATION: 10, WHATSAPP_PER_MESSAGE: 5, SMS_PER_MESSAGE: 2, EMAIL_PER_RECIPIENT: 1 }
    const starterCostPerCredit = plans.find(p => p.id === 'starter')?.costPerCreditBrl ?? 0.197

    const costBreakdown: CostBreakdownItem[] = [
        {
            operation: 'Geração IA (Gemini Flash)',
            creditCharged: CREDIT_COSTS_REF.AI_GENERATION,
            creditValueBrl: CREDIT_COSTS_REF.AI_GENERATION * starterCostPerCredit,
            realCostBrl: REAL_API_COSTS_BRL_CENTS.ai_flash_per_call / 100,
            marginPercent: 0,
        },
        {
            operation: 'WhatsApp (por mensagem)',
            creditCharged: CREDIT_COSTS_REF.WHATSAPP_PER_MESSAGE,
            creditValueBrl: CREDIT_COSTS_REF.WHATSAPP_PER_MESSAGE * starterCostPerCredit,
            realCostBrl: REAL_API_COSTS_BRL_CENTS.whatsapp_per_msg / 100,
            marginPercent: 0,
        },
        {
            operation: 'SMS (por mensagem)',
            creditCharged: CREDIT_COSTS_REF.SMS_PER_MESSAGE,
            creditValueBrl: CREDIT_COSTS_REF.SMS_PER_MESSAGE * starterCostPerCredit,
            realCostBrl: REAL_API_COSTS_BRL_CENTS.sms_per_msg / 100,
            marginPercent: 0,
        },
        {
            operation: 'E-mail (por destinatário)',
            creditCharged: CREDIT_COSTS_REF.EMAIL_PER_RECIPIENT,
            creditValueBrl: CREDIT_COSTS_REF.EMAIL_PER_RECIPIENT * starterCostPerCredit,
            realCostBrl: REAL_API_COSTS_BRL_CENTS.email_per_recipient / 100,
            marginPercent: 0,
        },
    ].map(item => ({
        ...item,
        marginPercent: item.realCostBrl > 0
            ? Number((((item.creditValueBrl - item.realCostBrl) / item.creditValueBrl) * 100).toFixed(1))
            : 100,
    }))

    // Markup alvo aplicado: 25% sobre custos reais
    const markupPercent = 25

    return {
        totalAiCostCents,
        totalCreditConsumed,
        totalCreditConsumedByType,
        plans,
        costBreakdown,
        markupPercent,
    }
}

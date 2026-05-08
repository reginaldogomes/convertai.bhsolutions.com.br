'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { PLATFORM_ORG_ID, requireSuperAdmin } from './utils'
import type { OrgAdminData, PlatformCostAnalysis, CostBreakdownItem } from './types'

const REAL_API_COSTS_BRL_CENTS = {
    ai_flash_per_call:    0.30,  // Gemini 2.5 Flash, ~2k chars avg/call
    ai_pro_per_call:      1.50,  // Gemini 2.5 Pro, ~2k chars avg/call
    whatsapp_per_msg:    19.00,  // Twilio BR, business-initiated
    sms_per_msg:         10.00,  // Twilio SMS BR
    email_per_recipient:  0.10,  // Resend (~$0.0008/email converted)
    supabase_per_request: 0.01,  // negligível, base de estimativa
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
            planId: sub.plan_id as string,
            planName: (sub.plans as unknown as { name: string } | null)?.name ?? sub.plan_id,
            priceBrl: (sub.plans as unknown as { price_brl: number } | null)?.price_brl ?? 0,
            status: sub.status,
            currentPeriodEnd: sub.current_period_end,
        } : null,
        creditsBalance: org?.credits_balance ?? 0,
    }
}

export async function getPlatformCostAnalysis(): Promise<PlatformCostAnalysis> {
    await requireSuperAdmin()
    const admin = createAdminClient()

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: aiCosts } = await admin
        .from('ai_usage_events')
        .select('estimated_cost_cents')
        .eq('status', 'success')
        .gte('created_at', startOfMonth.toISOString())
        .neq('organization_id', PLATFORM_ORG_ID)

    const totalAiCostCents = (aiCosts ?? []).reduce((sum: number, row: { estimated_cost_cents: unknown }) => {
        return sum + (Number(row.estimated_cost_cents) || 0)
    }, 0)

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

    const { data: plansData } = await admin
        .from('plans')
        .select('id, name, price_brl, monthly_credits')
        .order('sort_order')

    const plans = (plansData ?? []).map((p: {
        id: string
        name: string
        price_brl: unknown
        monthly_credits: unknown
    }) => {
        const price = Number(p.price_brl)
        const credits = Number(p.monthly_credits)
        const costPerCreditBrl = credits > 0 ? price / credits : 0

        const estApiCostPerCredit =
            (0.6 * REAL_API_COSTS_BRL_CENTS.ai_flash_per_call / 10 +
             0.3 * REAL_API_COSTS_BRL_CENTS.whatsapp_per_msg / 5 +
             0.1 * REAL_API_COSTS_BRL_CENTS.email_per_recipient / 1) / 100 

        const marginPercent = costPerCreditBrl > 0 ? ((costPerCreditBrl - estApiCostPerCredit) / costPerCreditBrl) * 100 : 0

        return {
            id: p.id,
            name: p.name,
            priceBrl: price,
            monthlyCredits: credits,
            costPerCreditBrl: Number(costPerCreditBrl.toFixed(4)),
            estimatedApiCostPerCredit: Number(estApiCostPerCredit.toFixed(4)),
            marginPercent: Number(marginPercent.toFixed(1)),
        }
    })

    const CREDIT_COSTS_REF = { AI_GENERATION: 10, WHATSAPP_PER_MESSAGE: 5, SMS_PER_MESSAGE: 2, EMAIL_PER_RECIPIENT: 1 }
    const starterCostPerCredit = plans.find((p: { id: string; costPerCreditBrl: number }) => p.id === 'starter')?.costPerCreditBrl ?? 0.197

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

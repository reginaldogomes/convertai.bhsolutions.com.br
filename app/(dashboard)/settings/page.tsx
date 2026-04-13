import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { PageHeader } from '@/components/layout/PageHeader'
import { Settings as SettingsIcon, Building, Puzzle, Mail, MessageSquare, MessageCircle, CheckCircle2, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsTabs } from './settings-tabs'
import { createAdminClient } from '@/lib/supabase/admin'

type AiGovernanceView = {
    available: boolean
    dailyRequestsLimit: number
    monthlyBudgetCents: number
    hardBlockEnabled: boolean
    dailyRequestsUsed: number
    monthlyCostCents: number
    monthlySuccessCount: number
}

type AiUsageEventView = {
    id: string
    createdAt: string
    status: 'started' | 'success' | 'error' | 'blocked'
    featureKey: string
    model: string
    routeScope: string
    estimatedCostCents: number
    durationMs: number | null
    errorCode: string | null
}

async function loadAiGovernance(orgId: string): Promise<AiGovernanceView> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admin = createAdminClient() as any

        const [policyResult, dailyCountResult, monthCostResult] = await Promise.all([
            admin
                .from('ai_quota_policies')
                .select('daily_requests_limit, monthly_budget_cents, hard_block_enabled')
                .eq('organization_id', orgId)
                .maybeSingle(),
            admin
                .from('ai_usage_events')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', orgId)
                .in('status', ['started', 'success'])
                .gte('created_at', new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())).toISOString()),
            admin
                .from('ai_usage_events')
                .select('estimated_cost_cents, status')
                .eq('organization_id', orgId)
                .eq('status', 'success')
                .gte('created_at', new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString()),
        ])

        const missingTableErrorCode =
            policyResult.error?.code ?? dailyCountResult.error?.code ?? monthCostResult.error?.code
        if (missingTableErrorCode === 'PGRST205' || missingTableErrorCode === '42P01') {
            return {
                available: false,
                dailyRequestsLimit: 120,
                monthlyBudgetCents: 3000,
                hardBlockEnabled: true,
                dailyRequestsUsed: 0,
                monthlyCostCents: 0,
                monthlySuccessCount: 0,
            }
        }

        const policy = policyResult.data
        const monthRows = monthCostResult.data ?? []
        const monthlyCostCents = monthRows.reduce((sum: number, row: { estimated_cost_cents?: number | string | null }) => {
            const value = Number(row.estimated_cost_cents ?? 0)
            return sum + (Number.isFinite(value) ? value : 0)
        }, 0)

        return {
            available: true,
            dailyRequestsLimit: policy?.daily_requests_limit ?? 120,
            monthlyBudgetCents: policy?.monthly_budget_cents ?? 3000,
            hardBlockEnabled: policy?.hard_block_enabled ?? true,
            dailyRequestsUsed: dailyCountResult.count ?? 0,
            monthlyCostCents,
            monthlySuccessCount: monthRows.length,
        }
    } catch {
        return {
            available: false,
            dailyRequestsLimit: 120,
            monthlyBudgetCents: 3000,
            hardBlockEnabled: true,
            dailyRequestsUsed: 0,
            monthlyCostCents: 0,
            monthlySuccessCount: 0,
        }
    }
}

async function loadAiUsageEvents(orgId: string): Promise<AiUsageEventView[]> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admin = createAdminClient() as any
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

        const { data, error } = await admin
            .from('ai_usage_events')
            .select('id, created_at, status, feature_key, model, route_scope, estimated_cost_cents, duration_ms, error_code')
            .eq('organization_id', orgId)
            .gte('created_at', ninetyDaysAgo)
            .order('created_at', { ascending: false })
            .limit(200)

        if (error) {
            if (error.code === 'PGRST205' || error.code === '42P01') {
                return []
            }
            throw error
        }

        return (data ?? []).map((row: {
            id: string
            created_at: string
            status: 'started' | 'success' | 'error' | 'blocked'
            feature_key: string
            model: string
            route_scope: string
            estimated_cost_cents?: number | string | null
            duration_ms?: number | null
            error_code?: string | null
        }) => ({
            id: row.id,
            createdAt: row.created_at,
            status: row.status,
            featureKey: row.feature_key,
            model: row.model,
            routeScope: row.route_scope,
            estimatedCostCents: Number(row.estimated_cost_cents ?? 0),
            durationMs: row.duration_ms ?? null,
            errorCode: row.error_code ?? null,
        }))
    } catch {
        return []
    }
}

async function loadKnowledgeEntryCount(orgId: string): Promise<number> {
    try {
        const entries = await useCases.listKnowledgeBase().execute(orgId)
        return entries.filter((entry) => entry.landingPageId === null).length
    } catch {
        return 0
    }
}

export default async function SettingsPage() {
    const auth = await tryGetAuthContext()
    const profileWithOrg = auth ? await useCases.getUserSettings().execute(auth.userId) : null
    const aiGovernance = auth ? await loadAiGovernance(auth.orgId) : null
    const aiUsageEvents = auth ? await loadAiUsageEvents(auth.orgId) : []
    const knowledgeEntryCount = auth ? await loadKnowledgeEntryCount(auth.orgId) : 0

    const integrations = {
        sendgrid: !!process.env.SENDGRID_API_KEY,
        twilioWhatsapp: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_WHATSAPP_NUMBER),
        twilioSms: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_SMS_NUMBER),
    }

    return (
        <div className="p-8 space-y-8 max-w-4xl">
            <PageHeader category="Administração" title="Configurações" icon={SettingsIcon} />

            <SettingsTabs
                profileWithOrg={profileWithOrg}
                integrations={integrations}
                aiGovernance={aiGovernance}
                aiUsageEvents={aiUsageEvents}
                knowledgeEntryCount={knowledgeEntryCount}
            />
        </div>
    )
}

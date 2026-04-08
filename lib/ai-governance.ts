import { createAdminClient } from '@/lib/supabase/admin'

const DEFAULT_DAILY_REQUESTS_LIMIT = 120
const DEFAULT_MONTHLY_BUDGET_CENTS = 3000

type SupportedProvider = 'google' | 'openai' | 'unknown'

type GovernanceStatus = 'started' | 'success' | 'error' | 'blocked'

type QuotaPolicy = {
    dailyRequestsLimit: number
    monthlyBudgetCents: number
    hardBlockEnabled: boolean
}

export type AiGovernanceContext = {
    organizationId: string
    userId?: string | null
    requestId: string
    routeScope: string
    featureKey: string
    model: string
    provider?: SupportedProvider
}

export type AiUsageRecordInput = {
    status: GovernanceStatus
    inputChars?: number
    outputChars?: number
    estimatedCostCents?: number
    durationMs?: number
    errorCode?: string
    metadata?: Record<string, unknown>
}

type GuardAllowed = {
    allowed: true
    policy: QuotaPolicy
}

type GuardBlocked = {
    allowed: false
    status: 402 | 429
    error: string
    policy: QuotaPolicy
}

export type AiGuardDecision = GuardAllowed | GuardBlocked

const MODEL_COST_CENTS_PER_1K_CHARS: Record<string, number> = {
    'gemini-2.5-flash': 0.03,
    'gemini-2.5-pro': 0.15,
    'gemini-2.5-flash-image': 0.4,
    'gemini-3.1-flash-image-preview': 0.8,
    'gemini-3-pro-image-preview': 2,
}

function startOfDayIso(now = new Date()): string {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
}

function startOfMonthIso(now = new Date()): string {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

function normalizePolicy(policy: Partial<{ daily_requests_limit: number; monthly_budget_cents: number; hard_block_enabled: boolean }> | null): QuotaPolicy {
    return {
        dailyRequestsLimit: policy?.daily_requests_limit ?? DEFAULT_DAILY_REQUESTS_LIMIT,
        monthlyBudgetCents: policy?.monthly_budget_cents ?? DEFAULT_MONTHLY_BUDGET_CENTS,
        hardBlockEnabled: policy?.hard_block_enabled ?? true,
    }
}

function isMissingTableError(error: unknown): boolean {
    if (!error || typeof error !== 'object' || !('code' in error)) {
        return false
    }

    const code = (error as { code?: string }).code
    return code === 'PGRST205' || code === '42P01'
}

export function estimateCostCents(model: string, inputChars: number, outputChars: number): number {
    const unitCost = MODEL_COST_CENTS_PER_1K_CHARS[model] ?? 0.08
    const totalChars = Math.max(0, inputChars) + Math.max(0, outputChars)
    const estimated = (totalChars / 1000) * unitCost
    return Number(estimated.toFixed(4))
}

async function getPolicy(organizationId: string): Promise<QuotaPolicy> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any

    const { data, error } = await supabase
        .from('ai_quota_policies')
        .select('daily_requests_limit, monthly_budget_cents, hard_block_enabled')
        .eq('organization_id', organizationId)
        .maybeSingle()

    if (error) {
        if (isMissingTableError(error)) {
            return normalizePolicy(null)
        }
        throw error
    }

    return normalizePolicy(data ?? null)
}

async function getTodaySuccessCount(organizationId: string): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any

    const { count, error } = await supabase
        .from('ai_usage_events')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .in('status', ['started', 'success'])
        .gte('created_at', startOfDayIso())

    if (error) {
        if (isMissingTableError(error)) {
            return 0
        }
        throw error
    }

    return count ?? 0
}

async function getMonthCostCents(organizationId: string): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any

    const { data, error } = await supabase
        .from('ai_usage_events')
        .select('estimated_cost_cents')
        .eq('organization_id', organizationId)
        .eq('status', 'success')
        .gte('created_at', startOfMonthIso())

    if (error) {
        if (isMissingTableError(error)) {
            return 0
        }
        throw error
    }

    return (data ?? []).reduce((sum: number, row: { estimated_cost_cents?: number | string | null }) => {
        const value = Number(row.estimated_cost_cents ?? 0)
        return sum + (Number.isFinite(value) ? value : 0)
    }, 0)
}

export async function enforceAiUsagePolicy(ctx: AiGovernanceContext): Promise<AiGuardDecision> {
    try {
        const [policy, dailyCount, monthCost] = await Promise.all([
            getPolicy(ctx.organizationId),
            getTodaySuccessCount(ctx.organizationId),
            getMonthCostCents(ctx.organizationId),
        ])

        if (!policy.hardBlockEnabled) {
            return { allowed: true, policy }
        }

        if (dailyCount >= policy.dailyRequestsLimit) {
            return {
                allowed: false,
                status: 429,
                error: 'Limite diário de uso de IA atingido para sua organização.',
                policy,
            }
        }

        if (monthCost >= policy.monthlyBudgetCents) {
            return {
                allowed: false,
                status: 402,
                error: 'Orçamento mensal de IA atingido para sua organização.',
                policy,
            }
        }

        return { allowed: true, policy }
    } catch {
        // Never block requests if governance infra is unavailable.
        return {
            allowed: true,
            policy: {
                dailyRequestsLimit: DEFAULT_DAILY_REQUESTS_LIMIT,
                monthlyBudgetCents: DEFAULT_MONTHLY_BUDGET_CENTS,
                hardBlockEnabled: true,
            },
        }
    }
}

export async function recordAiUsageEvent(ctx: AiGovernanceContext, input: AiUsageRecordInput): Promise<void> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supabase = createAdminClient() as any

        const inputChars = Math.max(0, input.inputChars ?? 0)
        const outputChars = Math.max(0, input.outputChars ?? 0)
        const estimatedCostCents =
            input.estimatedCostCents ?? estimateCostCents(ctx.model, inputChars, outputChars)

        const payload = {
            organization_id: ctx.organizationId,
            user_id: ctx.userId ?? null,
            request_id: ctx.requestId,
            route_scope: ctx.routeScope,
            feature_key: ctx.featureKey,
            provider: ctx.provider ?? 'google',
            model: ctx.model,
            status: input.status,
            input_chars: inputChars,
            output_chars: outputChars,
            estimated_cost_cents: estimatedCostCents,
            duration_ms: input.durationMs ?? null,
            error_code: input.errorCode ?? null,
            metadata_json: input.metadata ?? {},
        }

        const { error } = await supabase
            .from('ai_usage_events')
            .upsert(payload, { onConflict: 'organization_id,request_id,route_scope,status' })
        if (error && !isMissingTableError(error)) {
            throw error
        }
    } catch {
        // Keep usage tracking best-effort to avoid breaking user flows.
    }
}

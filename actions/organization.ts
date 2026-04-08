'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from './utils'
import { createAdminClient } from '@/lib/supabase/admin'

export async function updateOrganization(
    _prevState: { error: string; success: boolean },
    formData: FormData
) {
    try {
        const { orgId } = await getAuthContext()

        const result = await useCases.updateOrganization().execute(orgId, {
            orgName: (formData.get('name') as string) || undefined,
            orgEmail: formData.get('email') as string | null,
            orgPhone: formData.get('phone') as string | null,
            orgWebsite: formData.get('website') as string | null,
            orgAddress: formData.get('address') as string | null,
            orgCity: formData.get('city') as string | null,
            orgState: formData.get('state') as string | null,
            orgZipCode: formData.get('zipCode') as string | null,
            orgCountry: formData.get('country') as string | null,
            orgDescription: formData.get('description') as string | null,
        })

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/settings')
        return { error: '', success: true }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

function toPositiveInt(value: FormDataEntryValue | null, fallback: number): number {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return fallback
    return Math.max(1, Math.floor(parsed))
}

export async function updateAiGovernancePolicy(
    _prevState: { error: string; success: boolean },
    formData: FormData,
) {
    try {
        const { orgId } = await getAuthContext()

        const dailyRequestsLimit = toPositiveInt(formData.get('dailyRequestsLimit'), 120)
        const monthlyBudgetCents = toPositiveInt(formData.get('monthlyBudgetCents'), 3000)
        const hardBlockEnabled = formData.get('hardBlockEnabled') === 'on'

        if (dailyRequestsLimit < 1) {
            return { error: 'Limite diário deve ser maior que zero.', success: false }
        }

        if (monthlyBudgetCents < 100) {
            return { error: 'Orçamento mensal mínimo é de 100 centavos.', success: false }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admin = createAdminClient() as any

        const { error } = await admin
            .from('ai_quota_policies')
            .upsert(
                {
                    organization_id: orgId,
                    daily_requests_limit: dailyRequestsLimit,
                    monthly_budget_cents: monthlyBudgetCents,
                    hard_block_enabled: hardBlockEnabled,
                },
                { onConflict: 'organization_id' },
            )

        if (error) {
            if (error.code === 'PGRST205' || error.code === '42P01') {
                return {
                    error: 'Tabela de governança de IA não encontrada. Execute a migration 015_ai_governance.sql.',
                    success: false,
                }
            }

            return { error: error.message, success: false }
        }

        revalidatePath('/settings')
        return { error: '', success: true }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

export async function purgeAiUsageHistory(
    _prevState: { error: string; success: boolean; deletedCount: number },
    formData: FormData,
) {
    try {
        const { orgId } = await getAuthContext()
        const retentionDays = toPositiveInt(formData.get('retentionDays'), 90)
        const boundedRetentionDays = Math.min(3650, Math.max(1, retentionDays))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admin = createAdminClient() as any

        const { data, error } = await admin.rpc('purge_old_ai_usage_events', {
            target_organization_id: orgId,
            retention_days: boundedRetentionDays,
        })

        let deletedCount = 0

        if (error) {
            const isMissingRpc = error.code === 'PGRST202' || error.code === '42883'
            if (!isMissingRpc) {
                if (error.code === 'PGRST205' || error.code === '42P01') {
                    return {
                        error: 'Função de purge de IA não encontrada. Execute a migration 015_ai_governance.sql.',
                        success: false,
                        deletedCount: 0,
                    }
                }

                return { error: error.message, success: false, deletedCount: 0 }
            }

            const thresholdDate = new Date(Date.now() - boundedRetentionDays * 24 * 60 * 60 * 1000).toISOString()
            const { data: fallbackData, error: fallbackError } = await admin
                .from('ai_usage_events')
                .delete()
                .eq('organization_id', orgId)
                .lt('created_at', thresholdDate)
                .select('id')

            if (fallbackError) {
                return { error: fallbackError.message, success: false, deletedCount: 0 }
            }

            deletedCount = Array.isArray(fallbackData) ? fallbackData.length : 0
        } else {
            deletedCount = typeof data === 'number' ? data : 0
        }

        revalidatePath('/settings')
        return { error: '', success: true, deletedCount }
    } catch (err) {
        return { error: getErrorMessage(err), success: false, deletedCount: 0 }
    }
}

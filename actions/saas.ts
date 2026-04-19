'use server'

import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from './utils'
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache'
import type { PlanId } from '@/types/database'
import { z } from 'zod'

const REVALIDATE_HOURLY = 3600 // 1 hora

// --- Funções cacheadas para dados que mudam com pouca frequência ---

const getPlansCached = unstable_cache(
    async () => useCases.getPlans().execute(),
    ['plans'],
    { tags: ['plans'], revalidate: REVALIDATE_HOURLY },
)

const getCreditPacksCached = unstable_cache(
    async () => useCases.getCreditPacks().execute(),
    ['credit-packs'],
    { tags: ['credit-packs'], revalidate: REVALIDATE_HOURLY },
)

const listAllPlansAdminCached = unstable_cache(
    async () => useCases.listAllPlansAdmin().execute(),
    ['admin-plans'],
    { tags: ['plans', 'admin-plans'], revalidate: REVALIDATE_HOURLY },
)

const getPlanByIdCached = unstable_cache(
    async (id: string) => useCases.getPlanById().execute(id),
    ['admin-plan-by-id'],
    { tags: ['plans'] },
)

// ─── Plano / Assinatura ───────────────────────────────────────────────────────

export async function getMySubscription() {
    const { orgId } = await getAuthContext()
    const result = await useCases.getSubscription().execute(orgId)
    if (!result.ok) return { subscription: null, error: result.error.message }
    return { subscription: result.value, error: '' }
}

export async function getPlans() {
    const result = await getPlansCached()
    if (!result.ok) return { plans: [], error: result.error.message }
    return { plans: result.value, error: '' }
}

export async function getCreditPacks() {
    const result = await getCreditPacksCached()
    if (!result.ok) return { packs: [], error: result.error.message }
    return { packs: result.value, error: '' }
}

// ─── Histórico de créditos ────────────────────────────────────────────────────

export async function getCreditTransactions(limit?: number) {
    const { orgId } = await getAuthContext()
    const result = await useCases.getCreditTransactions().execute(orgId, limit)
    if (!result.ok) return { transactions: [], error: result.error.message }
    return { transactions: result.value, error: '' }
}

// Simulação de confirmação de compra para desenvolvimento (quando não há webhook)
export async function confirmCreditPurchase(packId: string) {
    const { orgId, userId } = await getAuthContext()
    const result = await useCases.grantCreditsFromPack().execute(orgId, userId, packId)
    if (!result.ok) return { error: result.error.message, success: false }

    revalidatePath('/settings')
    return { success: true, error: '' }
}

// ─── Admin: trocar plano de uma org ──────────────────────────────────────────

export async function adminChangePlan(prevState: unknown, formData: FormData) {
    try {
        const ctx = await getAuthContext()
        if (!ctx.isSuperAdmin) return { error: 'Acesso negado', success: false }

        const orgId = formData.get('orgId') as string
        const planId = formData.get('planId') as PlanId
        const notes = formData.get('notes') as string | null

        if (!orgId || !planId) return { error: 'Dados incompletos', success: false }

        const result = await useCases.changePlan().execute(orgId, { planId, notes: notes ?? undefined })
        if (!result.ok) return { error: result.error.message, success: false }

        revalidateTag('plans')
        revalidatePath('/admin/plans')
        return { success: true, error: '' }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

// ─── Admin: conceder créditos a uma org ──────────────────────────────────────

export async function adminGrantCredits(prevState: unknown, formData: FormData) {
    try {
        const ctx = await getAuthContext()
        if (!ctx.isSuperAdmin) return { error: 'Acesso negado', success: false }

        const orgId = formData.get('orgId') as string
        const amount = Number(formData.get('amount'))
        const reason = formData.get('reason') as string

        if (!orgId || !amount || !reason) return { error: 'Dados incompletos', success: false }

        const result = await useCases.grantCredits().execute(
            orgId,
            { amount, reason },
            ctx.userId,
        )
        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/admin/plans')
        return { success: true, error: '', newBalance: result.value }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

// ─── Admin: listar todas as assinaturas ──────────────────────────────────────

export async function listAllSubscriptions() {
    const ctx = await getAuthContext()
    if (!ctx.isSuperAdmin) return { subscriptions: [], error: 'Acesso negado' }

    const result = await useCases.listAllSubscriptions().execute()
    if (!result.ok) return { subscriptions: [], error: result.error.message }
    return { subscriptions: result.value, error: '' }
}

// ─── Admin: listar todos os planos (inclui inativos) ────────────────────────

export async function listAllPlansAdmin() {
    const ctx = await getAuthContext()
    if (!ctx.isSuperAdmin) return { plans: [], error: 'Acesso negado' }

    const result = await listAllPlansAdminCached()
    if (!result.ok) return { plans: [], error: result.error.message }
    return { plans: result.value, error: '' }
}

// ─── Admin: buscar plano por ID ────────────────────────────────────────────

export async function getPlanById(id: string) {
    const ctx = await getAuthContext()
    if (!ctx.isSuperAdmin) return null

    const result = await getPlanByIdCached(id)
    if (!result.ok) return null
    return result.value
}

// ─── Admin: criar ou atualizar plano ────────────────────────────────────────

const planUpsertSchema = z.object({
    id: z.string().optional().nullable(),
    name: z.string().min(1, { message: 'O nome do plano é obrigatório.' }),
    description: z.string().default(''),
    priceBrl: z.coerce.number({ invalid_type_error: 'Preço inválido.' }).min(0, 'O preço não pode ser negativo.'),
    monthlyCredits: z.coerce.number({ invalid_type_error: 'Créditos mensais inválidos.' }).int().min(0),
    maxContacts: z.coerce.number({ invalid_type_error: 'Nº máximo de contatos inválido.' }).int(),
    maxLandingPages: z.coerce.number({ invalid_type_error: 'Nº máximo de landing pages inválido.' }).int(),
    maxUsers: z.coerce.number({ invalid_type_error: 'Nº máximo de usuários inválido.' }).int().min(1),
    maxAutomations: z.coerce.number({ invalid_type_error: 'Nº máximo de automações inválido.' }).int(),
    sortOrder: z.coerce.number().int().default(0),
    isActive: z.preprocess((val) => val === 'on', z.boolean()),
    features: z.preprocess(
        (val) => (typeof val === 'string' && val ? val.split('\n').map((f) => f.trim()).filter(Boolean) : []),
        z.array(z.string()),
    ),
})

export async function upsertPlan(prevState: unknown, formData: FormData) {
    try {
        const ctx = await getAuthContext()
        if (!ctx.isSuperAdmin) return { error: 'Acesso negado', success: false }

        const parsed = planUpsertSchema.safeParse({
            id: formData.get('id'),
            name: formData.get('name'),
            description: formData.get('description'),
            priceBrl: formData.get('priceBrl'),
            monthlyCredits: formData.get('monthlyCredits'),
            maxContacts: formData.get('maxContacts'),
            maxLandingPages: formData.get('maxLandingPages'),
            maxUsers: formData.get('maxUsers'),
            maxAutomations: formData.get('maxAutomations'),
            sortOrder: formData.get('sortOrder'),
            isActive: formData.get('isActiveCheckbox'),
            features: formData.get('features'),
        })

        if (!parsed.success) {
            const errorMessage = parsed.error.flatten().fieldErrors
            const firstError = Object.values(errorMessage).flat()[0] ?? 'Dados de entrada inválidos.'
            return { error: firstError, success: false }
        }

        const result = await useCases.upsertPlan().execute(parsed.data)

        if (!result.ok) return { error: result.error.message, success: false }

        revalidateTag('plans')
        revalidatePath('/admin/plans')
        return { success: true, error: '', planId: result.value.id }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

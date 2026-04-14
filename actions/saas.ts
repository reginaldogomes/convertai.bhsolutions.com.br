'use server'

import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from './utils'
import { revalidatePath } from 'next/cache'
import type { PlanId } from '@/types/database'

// ─── Plano / Assinatura ───────────────────────────────────────────────────────

export async function getMySubscription() {
    const { orgId } = await getAuthContext()
    const result = await useCases.getSubscription().execute(orgId)
    if (!result.ok) return { subscription: null, error: result.error.message }
    return { subscription: result.value, error: '' }
}

export async function getPlans() {
    const result = await useCases.getPlans().execute()
    if (!result.ok) return { plans: [], error: result.error.message }
    return { plans: result.value, error: '' }
}

export async function getCreditPacks() {
    const result = await useCases.getCreditPacks().execute()
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

// ─── Compra de créditos ────────────────────────────────────────────────────────
// Nota: integração com gateway de pagamento deve ser feita aqui (ex: Stripe, Mercado Pago)
// Por ora, registra intenção e aguarda confirmação via webhook

export async function requestCreditPurchase(prevState: unknown, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()
        const packId = formData.get('packId') as string
        if (!packId) return { error: 'Pacote não informado', success: false }

        const packsResult = await useCases.getCreditPacks().execute()
        if (!packsResult.ok) return { error: packsResult.error.message, success: false }

        const pack = packsResult.value.find(p => p.id === packId)
        if (!pack) return { error: 'Pacote não encontrado', success: false }

        // TODO: integrar com gateway de pagamento (Stripe/MercadoPago)
        // Por ora retorna URL de checkout placeholder
        return {
            success: true,
            error: '',
            checkoutUrl: `/settings?tab=plan&pack=${packId}&confirm=1`,
            packName: pack.name,
            priceBrl: pack.formattedPrice(),
        }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
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

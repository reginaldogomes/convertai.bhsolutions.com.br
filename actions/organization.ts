'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { ragService, useCases } from '@/application/services/container'
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

function safeText(value: FormDataEntryValue | null, maxLen = 4000): string {
    if (typeof value !== 'string') return ''
    return value.trim().slice(0, maxLen)
}

function parseTagList(value: FormDataEntryValue | null): string[] {
    if (typeof value !== 'string') return []

    return Array.from(
        new Set(
            value
                .split(',')
                .map((tag) => tag.trim().toLowerCase())
                .filter((tag) => tag.length >= 2)
                .slice(0, 20),
        ),
    )
}

export async function saveKnowledgeBaseProfile(
    _prevState: { error: string; success: boolean },
    formData: FormData,
) {
    try {
        const { orgId } = await getAuthContext()

        const companySummary = safeText(formData.get('companySummary'), 5000)
        const niche = safeText(formData.get('niche'), 800)
        const targetAudience = safeText(formData.get('targetAudience'), 1200)
        const culture = safeText(formData.get('culture'), 2000)
        const brandVoice = safeText(formData.get('brandVoice'), 1200)
        const productsAndServices = safeText(formData.get('productsAndServices'), 4000)
        const differentiators = safeText(formData.get('differentiators'), 2500)
        const objectionsAndFaq = safeText(formData.get('objectionsAndFaq'), 4000)
        const customTags = parseTagList(formData.get('tags'))
        const autoTags = [niche, targetAudience]
            .flatMap((value) => value.split(/[,;\n]/g))
            .map((value) => value.trim().toLowerCase())
            .filter((value) => value.length >= 2)
        const tags = Array.from(new Set([...customTags, ...autoTags])).slice(0, 24)

        const fields = [
            companySummary,
            niche,
            targetAudience,
            culture,
            brandVoice,
            productsAndServices,
            differentiators,
            objectionsAndFaq,
        ]

        if (fields.every((field) => field.length === 0)) {
            return { error: 'Preencha ao menos um campo para salvar na base de conhecimento.', success: false }
        }

        const content = [
            'PERFIL ESTRATEGICO DA EMPRESA',
            `Atualizado em: ${new Date().toISOString()}`,
            '',
            `Resumo da empresa:\n${companySummary || 'Não informado.'}`,
            '',
            `Nicho de atuação:\n${niche || 'Não informado.'}`,
            '',
            `Público-alvo:\n${targetAudience || 'Não informado.'}`,
            '',
            `Cultura e valores:\n${culture || 'Não informado.'}`,
            '',
            `Tom de voz e posicionamento:\n${brandVoice || 'Não informado.'}`,
            '',
            `Produtos e serviços:\n${productsAndServices || 'Não informado.'}`,
            '',
            `Diferenciais competitivos:\n${differentiators || 'Não informado.'}`,
            '',
            `Objeções comuns e respostas:\n${objectionsAndFaq || 'Não informado.'}`,
        ].join('\n')

        const result = await useCases.addKnowledgeBase().execute(orgId, {
            landingPageId: null,
            title: 'Perfil Estratégico da Empresa',
            content,
        })

        if (!result.ok) return { error: result.error.message, success: false }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admin = createAdminClient() as any
        await admin
            .from('knowledge_base')
            .update({
                metadata_json: {
                    source: 'settings_knowledge_base',
                    profileType: 'organization_strategy',
                    tags,
                    niche,
                    targetAudience,
                    brandVoice,
                    updatedAt: new Date().toISOString(),
                },
            })
            .eq('id', result.value.id)
            .eq('organization_id', orgId)

        revalidatePath('/settings')
        return { error: '', success: true }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

export async function updateKnowledgeBaseEntry(formData: FormData) {
    try {
        const { orgId } = await getAuthContext()
        const entryId = safeText(formData.get('entryId'), 128)
        const title = safeText(formData.get('title'), 300)
        const content = safeText(formData.get('content'), 8000)
        const tags = parseTagList(formData.get('tags'))

        if (!entryId) return { error: 'Entrada inválida.', success: false }
        if (!title || !content) {
            return { error: 'Título e conteúdo são obrigatórios.', success: false }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admin = createAdminClient() as any

        const { error } = await admin
            .from('knowledge_base')
            .update({
                title,
                content,
                metadata_json: {
                    source: 'settings_knowledge_base',
                    tags,
                    updatedAt: new Date().toISOString(),
                },
            })
            .eq('id', entryId)
            .eq('organization_id', orgId)

        if (error) return { error: error.message, success: false }

        // Reindex updated content so RAG retrieval reflects latest edits.
        void ragService.indexContent(entryId, `${title}\n\n${content}`).catch(() => {
            // Non-critical: content already persisted and can be reindexed later.
        })

        revalidatePath('/settings')
        return { error: '', success: true }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

export async function deleteKnowledgeBaseEntry(formData: FormData) {
    try {
        const { orgId } = await getAuthContext()
        const entryId = safeText(formData.get('entryId'), 128)

        if (!entryId) return { error: 'Entrada inválida.', success: false }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admin = createAdminClient() as any
        const { error } = await admin
            .from('knowledge_base')
            .delete()
            .eq('id', entryId)
            .eq('organization_id', orgId)

        if (error) return { error: error.message, success: false }

        revalidatePath('/settings')
        return { error: '', success: true }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

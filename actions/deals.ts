'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import type { PipelineStage } from '@/types/database'
import { dispatchAutomationEvent } from '@/lib/automation-dispatcher'
import { createAdminClient } from '@/lib/supabase/admin'
import { getErrorMessage } from './utils'
import { z } from 'zod'

const createDealSchema = z.object({
    contactId: z.string({ required_error: 'Contato é obrigatório.' }).uuid('ID de contato inválido.'),
    title: z.string().min(1, 'O título do negócio é obrigatório.'),
    pipelineStage: z.string().min(1, 'A etapa do funil é obrigatória.'),
    value: z.coerce.number({ invalid_type_error: 'Valor inválido.' }).min(0, 'O valor não pode ser negativo.').default(0),
})

export async function createDeal(prevState: { error: string; success: boolean }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()

        const parsed = createDealSchema.safeParse({
            contactId: formData.get('contact_id'),
            title: formData.get('title'),
            pipelineStage: formData.get('pipeline_stage'),
            value: formData.get('value'),
        })

        if (!parsed.success) {
            const errorMessage = parsed.error.flatten().fieldErrors
            const firstError = Object.values(errorMessage).flat()[0] ?? 'Dados de entrada inválidos.'
            return { error: firstError, success: false }
        }

        const result = await useCases.createDeal().execute(orgId, parsed.data)

        if (!result.ok) return { error: result.error.message, success: false }

        void dispatchAutomationEvent({
            orgId,
            event: 'new_deal',
            context: {
                contactId: result.value.contactId,
                source: 'crm_deal_create',
                message: result.value.title,
                metadata: {
                    dealId: result.value.id,
                    pipelineStage: result.value.pipelineStage,
                    value: result.value.value,
                },
            },
        })

        revalidatePath('/deals')
        revalidatePath(`/contacts/${formData.get('contact_id')}`)
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function moveDeal(dealId: string, stage: PipelineStage) {
    try {
        const { orgId } = await getAuthContext()
        const supabase = createAdminClient()
        const { data: existingDeal } = await supabase
            .from('deals')
            .select('id, contact_id, pipeline_stage')
            .eq('id', dealId)
            .eq('organization_id', orgId)
            .maybeSingle()

        const result = await useCases.moveDeal().execute(dealId, stage, orgId)
        if (!result.ok) return { error: result.error.message }

        if (stage === 'fechado_ganho' || stage === 'fechado_perdido') {
            void dispatchAutomationEvent({
                orgId,
                event: stage === 'fechado_ganho' ? 'deal_won' : 'deal_lost',
                context: {
                    contactId: existingDeal?.contact_id ?? undefined,
                    source: 'crm_deal_stage_change',
                    metadata: {
                        dealId,
                        previousStage: existingDeal?.pipeline_stage,
                        stage,
                    },
                },
            })
        }

        revalidatePath('/deals')
        return { success: true }
    } catch (error) {
        return { error: getErrorMessage(error) }
    }
}

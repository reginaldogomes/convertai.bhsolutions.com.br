'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import type { PipelineStage } from '@/types/database'
import { dispatchAutomationEvent } from '@/lib/automation-dispatcher'
import { createAdminClient } from '@/lib/supabase/admin'
import { getErrorMessage } from './utils'

export async function createDeal(prevState: { error: string; success: boolean }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()

        const result = await useCases.createDeal().execute(orgId, {
            contactId: formData.get('contact_id') as string,
            title: formData.get('title') as string,
            pipelineStage: formData.get('pipeline_stage') as string,
            value: Number(formData.get('value')),
        })

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

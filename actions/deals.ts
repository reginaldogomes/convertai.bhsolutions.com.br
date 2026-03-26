'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import type { PipelineStage } from '@/types/database'

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

        revalidatePath('/deals')
        revalidatePath(`/contacts/${formData.get('contact_id')}`)
        return { error: '', success: true }
    } catch {
        return { error: 'Não autenticado', success: false }
    }
}

export async function moveDeal(dealId: string, stage: PipelineStage) {
    try {
        const { orgId } = await getAuthContext()
        const result = await useCases.moveDeal().execute(dealId, stage, orgId)
        if (!result.ok) return { error: result.error.message }
        revalidatePath('/deals')
        return { success: true }
    } catch {
        return { error: 'Não autenticado' }
    }
}

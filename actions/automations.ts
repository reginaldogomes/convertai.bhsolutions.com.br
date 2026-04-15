'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import type { AutomationWorkflow } from '@/domain/interfaces'
import { getErrorMessage } from './utils'
import { canDo } from '@/lib/permissions'

export async function createAutomation(
    prevState: { error: string; success: boolean; id?: string },
    formData: FormData,
) {
    try {
        const { orgId } = await getAuthContext()

        const workflowRaw = formData.get('workflow_json') as string
        const workflowJson: AutomationWorkflow = workflowRaw
            ? (JSON.parse(workflowRaw) as AutomationWorkflow)
            : { steps: [] }

        const result = await useCases.createAutomation().execute(orgId, {
            name: formData.get('name') as string,
            triggerEvent: formData.get('trigger_event') as string,
            workflowJson,
        })

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/automations')
        return { error: '', success: true, id: result.value.id }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function updateAutomation(
    id: string,
    prevState: { error: string; success: boolean },
    formData: FormData,
) {
    try {
        const { orgId } = await getAuthContext()

        const workflowRaw = formData.get('workflow_json') as string
        const workflowJson: AutomationWorkflow | undefined = workflowRaw
            ? (JSON.parse(workflowRaw) as AutomationWorkflow)
            : undefined

        const result = await useCases.updateAutomation().execute(id, orgId, {
            name: (formData.get('name') as string) || undefined,
            triggerEvent: (formData.get('trigger_event') as string) || undefined,
            workflowJson,
        })

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/automations')
        revalidatePath(`/automations/${id}`)
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function toggleAutomation(id: string, active: boolean): Promise<{ success: boolean; error?: string }> {
    try {
        const { orgId } = await getAuthContext()
        await useCases.toggleAutomation().execute(id, orgId, active)
        revalidatePath('/automations')
        return { success: true }
    } catch (error) {
        return { success: false, error: getErrorMessage(error) }
    }
}

export async function deleteAutomation(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { orgId, profile } = await getAuthContext()
        if (!canDo(profile.role, 'deleteAutomation')) return { success: false, error: 'Sem permissão para excluir automações.' }
        await useCases.deleteAutomation().execute(id, orgId)
        revalidatePath('/automations')
        return { success: true }
    } catch (error) {
        return { success: false, error: getErrorMessage(error) }
    }
}

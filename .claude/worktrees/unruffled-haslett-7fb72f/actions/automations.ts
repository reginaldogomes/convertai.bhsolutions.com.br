'use server'

import { revalidatePath } from 'next/cache'
import { useCases } from '@/application/services/container'
import type { AutomationWorkflow } from '@/domain/interfaces'
import { getErrorMessage, requirePermission } from './utils'
import { z } from 'zod'

const workflowJsonField = z
    .string()
    .default('{"steps":[]}')
    .transform((str, ctx) => {
        try {
            return JSON.parse(str || '{"steps":[]}') as AutomationWorkflow
        } catch {
            ctx.addIssue({ code: 'custom', message: 'Formato de workflow JSON inválido.' })
            return z.NEVER
        }
    })

// Schema for creating an automation
const createAutomationSchema = z.object({
    name: z.string().min(1, 'O nome é obrigatório.'),
    triggerEvent: z
        .string()
        .min(1, 'O gatilho do evento é obrigatório.'),
    workflowJson: workflowJsonField,
})

export async function createAutomation(
    prevState: { error: string; success: boolean; id?: string },
    formData: FormData,
) {
    try {
        const { orgId } = await requirePermission('createCampaign')

        const parsed = createAutomationSchema.safeParse({
            name: formData.get('name'),
            triggerEvent: formData.get('trigger_event'),
            workflowJson: formData.get('workflow_json'),
        })

        if (!parsed.success) {
            const errorMessage = parsed.error.flatten().fieldErrors
            const firstError = Object.values(errorMessage).flat()[0] ?? 'Dados de entrada inválidos.'
            return { error: firstError, success: false }
        }

        const result = await useCases.createAutomation().execute(orgId, parsed.data)

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/automations')
        return { error: '', success: true, id: result.value.id }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

const optionalString = z
    .string()
    .nullable()
    .transform(val => val || undefined)

const workflowForUpdate = z
    .string()
    .nullable()
    .transform((str, ctx) => {
        if (!str) return undefined
        try {
            return JSON.parse(str) as AutomationWorkflow
        } catch {
            ctx.addIssue({ code: 'custom', message: 'Formato de workflow JSON inválido.' })
            return z.NEVER
        }
    })

const updateAutomationSchema = z.object({
    name: optionalString,
    triggerEvent: optionalString,
    workflowJson: workflowForUpdate,
})

export async function updateAutomation(
    id: string,
    prevState: { error: string; success: boolean },
    formData: FormData,
) {
    try {
        const { orgId } = await requirePermission('createCampaign')

        const parsed = updateAutomationSchema.safeParse({
            name: formData.get('name'),
            triggerEvent: formData.get('trigger_event'),
            workflowJson: formData.get('workflow_json'),
        })

        if (!parsed.success) {
            const errorMessage = parsed.error.flatten().fieldErrors
            const firstError = Object.values(errorMessage).flat()[0] ?? 'Dados de entrada inválidos.'
            return { error: firstError, success: false }
        }

        const result = await useCases.updateAutomation().execute(id, orgId, parsed.data)

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
        const { orgId } = await requirePermission('createCampaign')
        await useCases.toggleAutomation().execute(id, orgId, active)
        revalidatePath('/automations')
        return { success: true }
    } catch (error) {
        return { success: false, error: getErrorMessage(error) }
    }
}

export async function deleteAutomation(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { orgId } = await requirePermission('deleteAutomation')
        await useCases.deleteAutomation().execute(id, orgId)
        revalidatePath('/automations')
        return { success: true }
    } catch (error) {
        return { success: false, error: getErrorMessage(error) }
    }
}

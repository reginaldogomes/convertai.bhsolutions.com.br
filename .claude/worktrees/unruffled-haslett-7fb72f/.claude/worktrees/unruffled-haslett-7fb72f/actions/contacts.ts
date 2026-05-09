'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from './utils'
import { canDo } from '@/lib/permissions'

export async function createContact(prevState: { error: string; success: boolean }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()

        const result = await useCases.createContact().execute(orgId, {
            name: formData.get('name') as string,
            email: (formData.get('email') as string) || '',
            phone: (formData.get('phone') as string) || '',
            company: (formData.get('company') as string) || '',
            tags: (formData.get('tags') as string) || '',
            notes: (formData.get('notes') as string) || '',
        })

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/contacts')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function deleteContact(contactId: string) {
    try {
        const { orgId, profile } = await getAuthContext()
        if (!canDo(profile.role, 'deleteContact')) return { error: 'Sem permissão para excluir contatos.' }
        const result = await useCases.deleteContact().execute(orgId, contactId)
        if (!result.ok) return { error: getErrorMessage(result.error) }
        revalidatePath('/contacts')
    } catch (error) {
        return { error: getErrorMessage(error) }
    }
    // redirect fora do try/catch — lança internamente no Next.js e não deve ser capturado
    redirect('/contacts')
}

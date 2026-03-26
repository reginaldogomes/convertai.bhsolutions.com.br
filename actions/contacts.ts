'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from './utils'

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

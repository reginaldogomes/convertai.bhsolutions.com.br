'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from './utils'

export async function sendMessage(prevState: { error: string; success?: boolean }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()

        const channel = (formData.get('channel') as string) || 'whatsapp'

        const result = await useCases.sendMessage().execute(orgId, {
            contactId: formData.get('contact_id') as string,
            content: formData.get('content') as string,
            channel,
        })

        if (!result.ok) return { error: result.error.message }

        revalidatePath('/inbox')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error) }
    }
}

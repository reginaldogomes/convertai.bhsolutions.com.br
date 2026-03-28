'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'

export async function sendMessage(prevState: { error: string; success?: boolean }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()

        const channel = (formData.get('channel') as string) || 'whatsapp'

        if (channel === 'whatsapp') {
            const limitCheck = await useCases.checkLimit().execute(orgId, 'whatsapp_monthly')
            if (!limitCheck.allowed) {
                return {
                    error: `Limite de ${limitCheck.label} atingido (${limitCheck.current}/${limitCheck.limit} este mês). Faça upgrade do seu plano para continuar enviando mensagens.`,
                }
            }
        }

        const result = await useCases.sendMessage().execute(orgId, {
            contactId: formData.get('contact_id') as string,
            content: formData.get('content') as string,
            channel,
        })

        if (!result.ok) return { error: result.error.message }

        revalidatePath('/inbox')
        return { error: '', success: true }
    } catch {
        return { error: 'Não autenticado' }
    }
}

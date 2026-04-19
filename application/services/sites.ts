'use server'

import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from './utils'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const createSiteSchema = z.object({
    name: z.string().min(1, 'O nome do site é obrigatório.'),
})

export async function createSite(prevState: { error: string }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()

        const parsed = createSiteSchema.safeParse({
            name: formData.get('name'),
        })

        if (!parsed.success) {
            const firstError = parsed.error.flatten().fieldErrors.name?.[0]
            return { error: firstError ?? 'Dados inválidos.' }
        }

        await useCases.createSite().execute(orgId, parsed.data)

        revalidatePath('/sites')
    } catch (error) {
        return { error: getErrorMessage(error) }
    }

    redirect('/sites')
}
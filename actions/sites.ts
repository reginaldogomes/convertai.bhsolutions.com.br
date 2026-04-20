'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { useCases } from '@/application/services/container'
import { getAuthContext } from '@/infrastructure/auth'
import { getErrorMessage } from './utils'

export async function listSites() {
    try {
        const { orgId } = await getAuthContext()
        // Assumes a `listSites` use case exists that returns all sites for an organization.
        const result = await useCases.listSites().execute(orgId)

        if (!result.ok) {
            return { sites: [], error: result.error.message }
        }

        // The use case should return a list of site entities.
        return { sites: result.value, error: null }
    } catch (error) {
        return { sites: [], error: getErrorMessage(error) }
    }
}

// Define um schema para validação dos dados do formulário usando Zod.
const CreateSiteSchema = z.object({
    name: z
        .string({ invalid_type_error: 'Nome inválido.' })
        .trim()
        .min(3, { message: 'O nome do site deve ter pelo menos 3 caracteres.' })
        .max(50, { message: 'O nome do site não pode ter mais de 50 caracteres.' }),
})

// O estado da action deve corresponder ao estado inicial usado em `useActionState`.
interface ActionState {
    error: string
}

export async function createSite(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        const { orgId } = await getAuthContext()

        const validatedFields = CreateSiteSchema.safeParse({
            name: formData.get('name'),
        })

        if (!validatedFields.success) {
            const firstError = validatedFields.error.flatten().fieldErrors.name?.[0]
            return { error: firstError ?? 'Dados inválidos.' }
        }

        // Executa o caso de uso para criar o site no banco de dados.
        // O use case lança um erro em caso de falha, que será capturado pelo bloco catch.
        await useCases.createSite().execute(orgId, { name: validatedFields.data.name })

        // Invalida o cache das páginas para que a lista de sites seja atualizada.
        revalidatePath('/sites')
    } catch (error) {
        return { error: getErrorMessage(error) }
    }

    // O redirect deve ser chamado fora do try...catch, pois ele lança uma exceção especial
    // que não deve ser capturada para que o Next.js possa seguir o redirecionamento.
    redirect('/sites')
}
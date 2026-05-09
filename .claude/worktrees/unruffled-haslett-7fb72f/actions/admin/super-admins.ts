'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from './utils'
import { getErrorMessage } from '../utils'
import { revalidatePath } from 'next/cache'
import type { SuperAdminUser } from './types'

export async function listSuperAdmins(): Promise<SuperAdminUser[]> {
    await requireSuperAdmin()
    const admin = createAdminClient()

    const {
        data: { users },
        error,
    } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })

    if (error) {
        console.error('Erro ao listar super admins:', { message: error.message, code: error.code })
        return []
    }
    const superAdmins = users.filter(u => u.app_metadata?.is_super_admin === true)

    return superAdmins.map(p => ({
        id: p.id,
        email: p.email ?? '—',
        name: (p.user_metadata as { name?: string })?.name ?? p.email ?? '—',
        createdAt: p.created_at,
    }))
}

export async function promoteToSuperAdmin(
    _prevState: { error: string; success: boolean },
    formData: FormData,
): Promise<{ error: string; success: boolean }> {
    try {
        await requireSuperAdmin()
        const email = (formData.get('email') as string | null)?.trim().toLowerCase() ?? ''
        if (!email) return { error: 'E-mail obrigatório.', success: false }

        const admin = createAdminClient()

        const { data: targetUser, error: findError } = await admin
            .from('users')
            .select('id')
            .eq('email', email)
            .single()

        if (findError || !targetUser) {
            return { error: 'Nenhum usuário cadastrado com este e-mail.', success: false }
        }

        const { data: authUserResponse, error: authError } = await admin.auth.admin.getUserById(targetUser.id)
        if (authError || !authUserResponse?.user) {
            return { error: 'Falha ao buscar dados de autenticação do usuário.', success: false }
        }
        const authUser = authUserResponse.user

        if (authUser.app_metadata?.is_super_admin === true) {
            return { error: 'Este usuário já é super admin.', success: false }
        }

        const { error: updateError } = await admin.auth.admin.updateUserById(targetUser.id, {
            app_metadata: { ...authUser.app_metadata, is_super_admin: true },
        })

        if (updateError) throw updateError

        revalidatePath('/admin/admins')
        return { success: true, error: '' }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

export async function demoteFromSuperAdmin(
    _prevState: { error: string; success: boolean },
    formData: FormData,
): Promise<{ error: string; success: boolean }> {
    try {
        const ctx = await requireSuperAdmin()
        const userId = formData.get('userId') as string | null
        if (!userId) return { error: 'ID do usuário obrigatório.', success: false }
        if (userId === ctx.userId)
            return { error: 'Não é possível remover seus próprios privilégios.', success: false }

        const admin = createAdminClient()
        const { data: target } = await admin.auth.admin.getUserById(userId)
        if (!target.user) return { error: 'Usuário não encontrado.', success: false }

        await admin.auth.admin.updateUserById(userId, {
            app_metadata: { ...target.user.app_metadata, is_super_admin: false },
        })

        revalidatePath('/admin/admins')
        return { success: true, error: '' }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

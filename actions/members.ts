'use server'

import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from './utils'
import { revalidatePath } from 'next/cache'
import type { UserRole } from '@/types/database'

// ─── Listar membros da org ────────────────────────────────────────────────────

export async function listOrgMembers() {
    const { orgId } = await getAuthContext()
    const result = await useCases.listOrgMembers().execute(orgId)
    if (!result.ok) return { members: [], error: result.error.message }
    return {
        members: result.value.map(m => ({
            id: m.id,
            name: m.name,
            email: m.email,
            role: m.role,
            avatarUrl: m.avatarUrl,
            createdAt: m.createdAt,
            initials: m.initials(),
            roleLabel: m.roleLabel(),
            isOwner: m.isOwner(),
        })),
        error: '',
    }
}

// ─── Convidar membro ──────────────────────────────────────────────────────────

export async function inviteMember(prevState: unknown, formData: FormData) {
    try {
        const { orgId, profile } = await getAuthContext()

        const email = (formData.get('email') as string)?.trim().toLowerCase()
        const name  = (formData.get('name')  as string)?.trim()
        const role  = (formData.get('role')  as UserRole) ?? 'agent'

        if (!email || !name) return { error: 'Nome e e-mail são obrigatórios.', success: false }

        const result = await useCases.inviteMember().execute(orgId, profile.role, { email, name, role })
        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/settings')
        return { success: true, error: '' }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

// ─── Atualizar role de membro ─────────────────────────────────────────────────

export async function updateMemberRole(prevState: unknown, formData: FormData) {
    try {
        const { orgId, userId, profile } = await getAuthContext()

        const targetUserId = formData.get('userId') as string
        const role = formData.get('role') as UserRole

        if (!targetUserId || !role) return { error: 'Dados incompletos.', success: false }

        const result = await useCases.updateMemberRole().execute(orgId, userId, profile.role, {
            targetUserId,
            role,
        })
        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/settings')
        return { success: true, error: '' }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

// ─── Remover membro ───────────────────────────────────────────────────────────

export async function removeMember(prevState: unknown, formData: FormData) {
    try {
        const { orgId, userId, profile } = await getAuthContext()
        const targetUserId = formData.get('userId') as string

        if (!targetUserId) return { error: 'ID do membro não informado.', success: false }

        const result = await useCases.removeMember().execute(orgId, userId, profile.role, targetUserId)
        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/settings')
        return { success: true, error: '' }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

// ─── Transferir propriedade ───────────────────────────────────────────────────

export async function transferOwnership(prevState: unknown, formData: FormData) {
    try {
        const { orgId, userId, profile } = await getAuthContext()
        const newOwnerId = formData.get('userId') as string

        if (!newOwnerId) return { error: 'ID do novo proprietário não informado.', success: false }

        const result = await useCases.transferOwnership().execute(orgId, userId, profile.role, newOwnerId)
        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/settings')
        return { success: true, error: '' }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

// ─── Super Admin: alterar role de usuário ────────────────────────────────────

export async function adminUpdateUserRole(prevState: unknown, formData: FormData) {
    try {
        const ctx = await getAuthContext()
        if (!ctx.isSuperAdmin) return { error: 'Acesso negado.', success: false }

        const targetUserId = formData.get('userId') as string
        const orgId = formData.get('orgId') as string
        const role = formData.get('role') as UserRole

        if (!targetUserId || !orgId || !role) return { error: 'Dados incompletos.', success: false }

        const result = await useCases.updateMemberRole().execute(orgId, ctx.userId, 'owner', {
            targetUserId,
            role,
        })
        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/admin/users')
        return { success: true, error: '' }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

// ─── Super Admin: remover usuário ────────────────────────────────────────────

export async function adminRemoveUser(prevState: unknown, formData: FormData) {
    try {
        const ctx = await getAuthContext()
        if (!ctx.isSuperAdmin) return { error: 'Acesso negado.', success: false }

        const targetUserId = formData.get('userId') as string
        const orgId = formData.get('orgId') as string

        if (!targetUserId || !orgId) return { error: 'Dados incompletos.', success: false }

        const result = await useCases.removeMember().execute(orgId, ctx.userId, 'owner', targetUserId)
        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/admin/users')
        return { success: true, error: '' }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

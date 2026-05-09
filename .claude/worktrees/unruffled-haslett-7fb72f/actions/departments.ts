'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthContext } from '@/infrastructure/auth'
import { getErrorMessage } from './utils'
import { z } from 'zod'

const uuidSchema = z.string().uuid()
function isUuid(v: string) { return uuidSchema.safeParse(v).success }

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function listDepartments() {
    try {
        const { orgId } = await getAuthContext()
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('departments')
            .select('id, name, color, created_at')
            .eq('organization_id', orgId)
            .order('name', { ascending: true })
        if (error) return { departments: [], error: error.message }
        return {
            departments: (data ?? []).map(d => ({
                id: d.id,
                name: d.name,
                color: d.color,
                createdAt: d.created_at,
            })),
            error: null,
        }
    } catch (err) {
        return { departments: [], error: getErrorMessage(err) }
    }
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createDepartment(
    _prevState: { error: string; success: boolean },
    formData: FormData,
) {
    try {
        const { orgId, profile } = await getAuthContext()
        if (profile.role !== 'owner' && profile.role !== 'admin') return { error: 'Sem permissão.', success: false }
        const name = (formData.get('name') as string | null)?.trim()
        const color = (formData.get('color') as string | null)?.trim() || '#6366f1'

        if (!name || name.length < 2) return { error: 'Nome deve ter pelo menos 2 caracteres.', success: false }
        if (name.length > 60) return { error: 'Nome não pode ter mais de 60 caracteres.', success: false }

        const supabase = createAdminClient()
        const { error } = await supabase
            .from('departments')
            .insert({ organization_id: orgId, name, color })

        if (error) {
            if (error.code === '23505') return { error: 'Já existe um departamento com esse nome.', success: false }
            return { error: error.message, success: false }
        }

        revalidatePath('/settings')
        return { error: '', success: true }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateDepartment(
    _prevState: { error: string; success: boolean },
    formData: FormData,
) {
    try {
        const { orgId, profile } = await getAuthContext()
        if (profile.role !== 'owner' && profile.role !== 'admin') return { error: 'Sem permissão.', success: false }
        const id = (formData.get('id') as string | null) ?? ''
        const name = (formData.get('name') as string | null)?.trim()
        const color = (formData.get('color') as string | null)?.trim()

        if (!isUuid(id)) return { error: 'ID inválido.', success: false }
        if (!name || name.length < 2) return { error: 'Nome deve ter pelo menos 2 caracteres.', success: false }
        if (name.length > 60) return { error: 'Nome não pode ter mais de 60 caracteres.', success: false }

        const supabase = createAdminClient()
        const update: Record<string, string> = { name }
        if (color) update.color = color

        const { error } = await supabase
            .from('departments')
            .update(update)
            .eq('id', id)
            .eq('organization_id', orgId)

        if (error) {
            if (error.code === '23505') return { error: 'Já existe um departamento com esse nome.', success: false }
            return { error: error.message, success: false }
        }

        revalidatePath('/settings')
        return { error: '', success: true }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteDepartment(departmentId: string) {
    if (!isUuid(departmentId)) return { error: 'ID inválido.', success: false }
    try {
        const { orgId, profile } = await getAuthContext()
        if (profile.role !== 'owner' && profile.role !== 'admin') return { error: 'Sem permissão.', success: false }
        const supabase = createAdminClient()
        const { error } = await supabase
            .from('departments')
            .delete()
            .eq('id', departmentId)
            .eq('organization_id', orgId)
        if (error) return { error: error.message, success: false }
        revalidatePath('/settings')
        return { error: '', success: true }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

// ─── Assign (replace all departments for a user) ─────────────────────────────

export async function setUserDepartments(userId: string, departmentIds: string[]) {
    if (!isUuid(userId)) return { error: 'ID de usuário inválido.', success: false }
    if (departmentIds.some(id => !isUuid(id))) return { error: 'Um ou mais IDs de departamento são inválidos.', success: false }
    try {
        const { orgId, profile } = await getAuthContext()
        if (profile.role !== 'owner' && profile.role !== 'admin') return { error: 'Sem permissão.', success: false }
        const supabase = createAdminClient()

        // Confirm target user belongs to this org
        const { data: targetUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .eq('organization_id', orgId)
            .single()
        if (!targetUser) return { error: 'Usuário não encontrado nesta organização.', success: false }

        // Confirm all dept IDs belong to this org
        if (departmentIds.length > 0) {
            const { data: validDepts } = await supabase
                .from('departments')
                .select('id')
                .eq('organization_id', orgId)
                .in('id', departmentIds)
            const validIds = new Set((validDepts ?? []).map(d => d.id))
            if (departmentIds.some(id => !validIds.has(id))) {
                return { error: 'Um ou mais departamentos não pertencem a esta organização.', success: false }
            }
        }

        // Atomic replace: delete existing → insert new
        await supabase.from('user_departments').delete().eq('user_id', userId)
        if (departmentIds.length > 0) {
            await supabase.from('user_departments').insert(
                departmentIds.map(department_id => ({ user_id: userId, department_id }))
            )
        }

        revalidatePath('/settings')
        return { error: '', success: true }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

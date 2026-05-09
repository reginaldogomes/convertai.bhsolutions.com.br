'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { createAdminClient } from '@/lib/supabase/admin'
import { getErrorMessage } from '../utils'

const MAX_LOGO_BYTES = 2 * 1024 * 1024
const LOGO_BUCKET = 'brand-assets'
const ALLOWED_LOGO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])

function sanitizeFileName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 80)
}

/**
 * Faz upload de um logo para o bucket brand-assets e salva a URL pública
 * na landing page informada. Reutilizável para sites passando o entityPath
 * adequado e o updater específico de cada entidade.
 */
export async function uploadBrandLogo(
    pageId: string,
    _prevState: { error: string; success: boolean; logoUrl?: string },
    formData: FormData,
): Promise<{ error: string; success: boolean; logoUrl?: string }> {
    try {
        const { orgId } = await getAuthContext()

        const pageResult = await useCases.getLandingPage().execute(orgId, pageId)
        if (!pageResult.ok) return { error: 'Página não encontrada.', success: false }

        const file = formData.get('logoFile') as File | null
        if (!file || file.size === 0) return { error: 'Selecione uma imagem.', success: false }
        if (!ALLOWED_LOGO_TYPES.has(file.type)) return { error: 'Use JPG, PNG, WEBP ou SVG.', success: false }
        if (file.size > MAX_LOGO_BYTES) return { error: 'Imagem muito grande. Limite de 2MB.', success: false }

        const ext = file.name.split('.').pop() ?? 'png'
        const baseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ''))
        const storagePath = `${orgId}/${pageId}/${baseName}-${Date.now()}.${ext}`

        const supabase = createAdminClient()
        const { error: uploadError } = await supabase.storage
            .from(LOGO_BUCKET)
            .upload(storagePath, file, { upsert: true, contentType: file.type })

        if (uploadError) return { error: `Erro no upload: ${uploadError.message}`, success: false }

        const { data: { publicUrl } } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(storagePath)

        const page = pageResult.value
        const updatedConfig = { ...(page.configJson as unknown as Record<string, unknown>), logoUrl: publicUrl }
        const result = await useCases.updateLandingPage().execute(orgId, pageId, { configJson: updatedConfig })

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath(`/landing-pages/${pageId}`)
        revalidatePath(`/p/${page.slug}`)
        return { error: '', success: true, logoUrl: publicUrl }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

export async function removeBrandLogo(
    pageId: string,
): Promise<{ error: string; success: boolean }> {
    try {
        const { orgId } = await getAuthContext()

        const pageResult = await useCases.getLandingPage().execute(orgId, pageId)
        if (!pageResult.ok) return { error: 'Página não encontrada.', success: false }

        const page = pageResult.value
        const updatedConfig = { ...(page.configJson as unknown as Record<string, unknown>), logoUrl: null }
        const result = await useCases.updateLandingPage().execute(orgId, pageId, { configJson: updatedConfig })

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath(`/landing-pages/${pageId}`)
        revalidatePath(`/p/${page.slug}`)
        return { error: '', success: true }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

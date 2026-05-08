'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from '../utils'
import { canDo } from '@/lib/permissions'

export async function publishLandingPage(pageId: string, publish: boolean) {
    try {
        const { orgId } = await getAuthContext()
        const pageResult = await useCases.getLandingPage().execute(orgId, pageId)
        if (!pageResult.ok) return { error: pageResult.error.message, success: false }

        const result = await useCases.publishLandingPage().execute(orgId, pageId, publish)

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/landing-pages')
        revalidatePath(`/landing-pages/${pageId}`)
        revalidatePath(`/p/${pageResult.value.slug}`)
        revalidatePath('/sitemap.xml')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function deleteLandingPage(pageId: string) {
    try {
        const { orgId, profile } = await getAuthContext()
        if (!canDo(profile.role, 'deleteLandingPage')) return { error: 'Sem permissão para excluir landing pages.', success: false }
        const pageResult = await useCases.getLandingPage().execute(orgId, pageId)
        if (!pageResult.ok) return { error: pageResult.error.message, success: false }

        const result = await useCases.deleteLandingPage().execute(orgId, pageId)

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/landing-pages')
        revalidatePath(`/p/${pageResult.value.slug}`)
        revalidatePath('/sitemap.xml')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

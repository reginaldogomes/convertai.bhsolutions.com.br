'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { getErrorMessage } from './utils'
import { useCases } from '@/application/services/container'

type DomainActionState = {
    error?: string
    success?: boolean
    message?: string
}

export async function listCustomDomains() {
    try {
        const { orgId } = await getAuthContext()
        const domains = await useCases.listCustomDomains().execute(orgId)

        return {
            domains: domains.map(d => ({
                id: d.id,
                domain: d.domain,
                status: d.status,
                createdAt: d.createdAt.toISOString(),
                targetPageId: d.targetPageId,
            })),
            error: null
        }
    } catch (error) {
        return { domains: [], error: getErrorMessage(error) }
    }
}

export async function addCustomDomain(prevState: DomainActionState, formData: FormData): Promise<DomainActionState> {
    try {
        const { orgId } = await getAuthContext()
        const domain = (formData.get('domain') as string)?.trim().toLowerCase()
        const targetPageId = (formData.get('targetPageId') as string) || undefined

        await useCases.addCustomDomain().execute(orgId, {
            domain: domain,
            targetPageId: targetPageId,
        })

        revalidatePath('/settings')
        return {
            success: true,
            message: 'Domínio adicionado com sucesso. Aponte o CNAME do seu domínio para cname.convertai.bhsolutions.com.br para validação.',
        }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function deleteCustomDomain(prevState: DomainActionState, formData: FormData): Promise<DomainActionState> {
    try {
        const { orgId } = await getAuthContext()
        const domainId = formData.get('domainId') as string

        await useCases.deleteCustomDomain().execute(orgId, domainId)

        revalidatePath('/settings')
        return { success: true, message: 'Domínio removido com sucesso.' }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function checkDomainStatus(prevState: DomainActionState, formData: FormData): Promise<DomainActionState> {
    try {
        const { orgId } = await getAuthContext()
        const domainId = formData.get('domainId') as string
        const cnameTarget = process.env.NEXT_PUBLIC_CUSTOM_DOMAIN_CNAME_TARGET || 'cname.convertai.bhsolutions.com.br'

        const domain = await useCases.checkCustomDomainStatus().execute(orgId, domainId, cnameTarget)

        revalidatePath('/settings')

        if (domain.isActive) {
            return { 
                success: true, 
                message: 'Domínio verificado e ativado com sucesso!' 
            }
        } else if (domain.isError) {
            return { 
                error: 'Falha na verificação. Certifique-se de que o CNAME apontaa para ' + cnameTarget,
                success: false 
            }
        } else {
            return { 
                message: 'Domínio ainda está sendo verificado. Tente novamente em alguns minutos.',
                success: false 
            }
        }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}
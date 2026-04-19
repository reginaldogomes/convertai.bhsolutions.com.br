'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { getErrorMessage } from './utils'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { DomainError } from '@/domain/errors'
import { resolve } from 'dns/promises'

type DomainActionState = {
    error?: string
    success?: boolean
    message?: string
}

export async function addCustomDomain(prevState: DomainActionState, formData: FormData): Promise<DomainActionState> {
    try {
        const { orgId } = await getAuthContext()
        const domain = (formData.get('domain') as string)?.trim().toLowerCase();
        const targetPageId = (formData.get('targetPageId') as string) || null

        if (!domain) {
            throw new DomainError('VALIDATION_ERROR', 'O nome de domínio é obrigatório.')
        }
        // Validação simples de formato de domínio
        if (!/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,63}$/.test(domain)) {
            throw new DomainError('VALIDATION_ERROR', 'Formato de domínio inválido.')
        }

        const admin = createAdminClient()

        // TODO: Integrar com a API do provedor de hospedagem (ex: Vercel) para adicionar o domínio
        // e obter os registros DNS que o usuário precisa configurar.
        // Por enquanto, vamos apenas adicionar ao banco com status 'pending'.

        const { error: insertError } = await admin.from('custom_domains').insert({
            organization_id: orgId,
            domain: domain,
            target_page_id: targetPageId || null,
            status: 'pending',
        })

        if (insertError) {
            if (insertError.code === '23505') { // unique_violation
                throw new DomainError('CONFLICT', 'Este domínio já está em uso por outra organização.')
            }
            throw insertError
        }

        revalidatePath('/settings')
        return {
            success: true,
            message: 'Domínio adicionado com sucesso. Aponte o CNAME do seu domínio para cname.convertai.bhsolutions.com.br para validação.',
        }
    } catch (error) {
        return { error: getErrorMessage(error) }
    }
}

export async function listCustomDomains() {
    try {
        const { orgId } = await getAuthContext()
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('custom_domains')
            .select('id, domain, status, created_at, verified_at, target_page_id, landing_pages ( name, slug )')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return {
            domains: data.map(d => ({
                id: d.id,
                domain: d.domain,
                status: d.status as 'pending' | 'active' | 'error',
                createdAt: d.created_at,
                verifiedAt: d.verified_at,
                target: d.landing_pages ? {
                    id: d.target_page_id,
                    name: (d.landing_pages as { name: string }).name,
                    slug: (d.landing_pages as { slug: string }).slug,
                } : null,
            })),
            error: null
        }
    } catch (error) {
        return { domains: [], error: getErrorMessage(error) }
    }
}

export async function deleteCustomDomain(prevState: { error?: string }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()
        const domainId = formData.get('domainId') as string

        if (!domainId) {
            throw new DomainError('VALIDATION_ERROR', 'ID do domínio é obrigatório.')
        }

        const admin = createAdminClient()

        // TODO: Integrar com a API do provedor de hospedagem (ex: Vercel) para remover o domínio do projeto.

        const { error } = await admin.from('custom_domains').delete().match({ id: domainId, organization_id: orgId })

        if (error) throw error

        revalidatePath('/settings')
        return { success: true, message: 'Domínio removido com sucesso.' }
    } catch (error) {
        return { error: getErrorMessage(error) }
    }
}

export async function checkDomainStatus(prevState: { error?: string; message?: string }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()
        const domain = formData.get('domain') as string

        if (!domain) {
            throw new DomainError('VALIDATION_ERROR', 'Nome do domínio é obrigatório para verificação.')
        }

        const admin = createAdminClient()
        const cnameTarget = process.env.NEXT_PUBLIC_CUSTOM_DOMAIN_CNAME_TARGET || 'cname.convertai.bhsolutions.com.br'

        let status: 'active' | 'error' | 'pending' = 'pending'
        let verificationDetails: Record<string, unknown> = {}

        try {
            const cnameRecords = await resolve(domain, 'CNAME')
            const foundCname = cnameRecords[0]

            if (foundCname.toLowerCase() === cnameTarget.toLowerCase()) {
                status = 'active'
                verificationDetails = { reason: 'cname_match', found: foundCname }
            } else {
                status = 'error'
                verificationDetails = { reason: 'invalid_cname_target', found: foundCname, expected: cnameTarget }
            }
        } catch (err: any) {
            if (err.code === 'ENODATA' || err.code === 'ENOTFOUND') {
                // Nenhum CNAME encontrado, verifica se há registros A conflitantes
                try {
                    const aRecords = await resolve(domain, 'A')
                    if (aRecords.length > 0) {
                        status = 'error'
                        verificationDetails = { reason: 'conflicting_a_record', found: aRecords }
                    }
                } catch (aErr: any) {
                    // Se também não houver registro A, o domínio não está configurado
                    if (aErr.code === 'ENODATA' || aErr.code === 'ENOTFOUND') {
                        verificationDetails = { reason: 'not_configured' }
                    }
                }
            } else {
                // Outros erros de DNS
                status = 'error'
                verificationDetails = { reason: 'dns_lookup_failed', error: err.message }
            }
        }

        const { error: updateError } = await admin.from('custom_domains').update({
            status,
            verification_data: verificationDetails,
            verified_at: status === 'active' ? new Date().toISOString() : null,
        }).match({ domain, organization_id: orgId })

        if (updateError) throw updateError

        revalidatePath('/settings')

        const messageMap = {
            active: 'Domínio verificado e ativo!',
            error: 'Falha na verificação. Verifique as instruções de DNS e tente novamente.',
            pending: 'Domínio ainda pendente. A propagação do DNS pode levar algum tempo.'
        }

        return { success: true, message: messageMap[status] }
    } catch (error) {
        return { error: getErrorMessage(error) }
    }
}
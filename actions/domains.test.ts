import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { addCustomDomain, deleteCustomDomain, checkDomainStatus, listCustomDomains } from '@/actions/domains'
import { getAuthContext } from '@/infrastructure/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { resolve } from 'dns/promises'
import { revalidatePath } from 'next/cache'

// Mock das dependências
vi.mock('@/infrastructure/auth')
vi.mock('@/lib/supabase/admin')
vi.mock('@/lib/supabase/server')
vi.mock('dns/promises')
vi.mock('next/cache')

const mockOrgId = 'org-123'
const mockUserId = 'user-123'

const mockGetAuthContext = vi.mocked(getAuthContext)
const mockCreateAdminClient = vi.mocked(createAdminClient)
const mockCreateClient = vi.mocked(createClient)
const mockDnsResolve = vi.mocked(resolve)
const mockRevalidatePath = vi.mocked(revalidatePath)

describe('Domain Server Actions', () => {
    let mockSupabaseAdmin: any
    let mockSupabase: any

    beforeEach(() => {
        mockGetAuthContext.mockResolvedValue({
            orgId: mockOrgId,
            userId: mockUserId,
            profile: { role: 'owner' } as any,
            isSuperAdmin: false,
        })

        mockSupabaseAdmin = {
            from: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            match: vi.fn().mockResolvedValue({ error: null }),
        }
        mockCreateAdminClient.mockReturnValue(mockSupabaseAdmin)

        mockSupabase = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }
        mockCreateClient.mockResolvedValue(mockSupabase)

        process.env.NEXT_PUBLIC_CUSTOM_DOMAIN_CNAME_TARGET = 'cname.convertai.bhsolutions.com.br'
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    // --- addCustomDomain ---
    describe('addCustomDomain', () => {
        it('deve adicionar um domínio com sucesso', async () => {
            const formData = new FormData()
            formData.append('domain', 'teste.exemplo.com')
            formData.append('targetPageId', 'page-123')

            mockSupabaseAdmin.insert.mockResolvedValue({ error: null })

            const result = await addCustomDomain({}, formData)

            expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('custom_domains')
            expect(mockSupabaseAdmin.insert).toHaveBeenCalledWith({
                organization_id: mockOrgId,
                domain: 'teste.exemplo.com',
                target_page_id: 'page-123',
                status: 'pending',
            })
            expect(mockRevalidatePath).toHaveBeenCalledWith('/settings')
            expect(result.success).toBe(true)
            expect(result.message).toContain('Domínio adicionado com sucesso')
        })

        it('deve retornar erro de validação se o domínio estiver ausente', async () => {
            const formData = new FormData()
            const result = await addCustomDomain({}, formData)
            expect(result.success).toBe(undefined)
            expect(result.error).toBe('O nome de domínio é obrigatório.')
        })

        it('deve retornar erro de validação para formato de domínio inválido', async () => {
            const formData = new FormData()
            formData.append('domain', 'dominio-invalido')
            const result = await addCustomDomain({}, formData)
            expect(result.success).toBe(undefined)
            expect(result.error).toBe('Formato de domínio inválido.')
        })

        it('deve lidar com violação de restrição única (domínio duplicado)', async () => {
            const formData = new FormData()
            formData.append('domain', 'teste.exemplo.com')
            mockSupabaseAdmin.insert.mockResolvedValue({ error: { code: '23505' } })

            const result = await addCustomDomain({}, formData)

            expect(result.success).toBe(undefined)
            expect(result.error).toBe('Este domínio já está em uso por outra organização.')
        })
    })

    // --- deleteCustomDomain ---
    describe('deleteCustomDomain', () => {
        it('deve deletar um domínio com sucesso', async () => {
            const formData = new FormData()
            formData.append('domainId', 'domain-id-456')

            const result = await deleteCustomDomain({}, formData)

            expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('custom_domains')
            expect(mockSupabaseAdmin.delete).toHaveBeenCalled()
            expect(mockSupabaseAdmin.match).toHaveBeenCalledWith({ id: 'domain-id-456', organization_id: mockOrgId })
            expect(mockRevalidatePath).toHaveBeenCalledWith('/settings')
            expect(result.success).toBe(true)
            expect(result.message).toBe('Domínio removido com sucesso.')
        })
    })

    // --- checkDomainStatus ---
    describe('checkDomainStatus', () => {
        it('deve definir o status como "active" para CNAME correto', async () => {
            const domain = 'sub.meudominio.com'
            const formData = new FormData()
            formData.append('domain', domain)

            mockDnsResolve.mockResolvedValue(['cname.convertai.bhsolutions.com.br'])

            const result = await checkDomainStatus({}, formData)

            expect(mockDnsResolve).toHaveBeenCalledWith(domain, 'CNAME')
            expect(mockSupabaseAdmin.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }))
            expect(result.message).toBe('Domínio verificado e ativo!')
            expect(result.success).toBe(true)
        })

        it('deve definir o status como "error" para CNAME incorreto', async () => {
            const domain = 'sub.meudominio.com'
            const formData = new FormData()
            formData.append('domain', domain)

            mockDnsResolve.mockResolvedValue(['cname.errado.com'])

            const result = await checkDomainStatus({}, formData)

            expect(mockDnsResolve).toHaveBeenCalledWith(domain, 'CNAME')
            expect(mockSupabaseAdmin.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }))
            expect(result.message).toContain('Falha na verificação')
        })

        it('deve definir o status como "error" para registro A conflitante', async () => {
            const domain = 'sub.meudominio.com'
            const formData = new FormData()
            formData.append('domain', domain)

            mockDnsResolve.mockRejectedValueOnce({ code: 'ENODATA' }) // Falha na busca por CNAME
            mockDnsResolve.mockResolvedValueOnce(['192.0.2.1'])      // Sucesso na busca por A

            await checkDomainStatus({}, formData)

            expect(mockDnsResolve).toHaveBeenCalledWith(domain, 'A')
            expect(mockSupabaseAdmin.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }))
        })
    })

    // --- listCustomDomains ---
    describe('listCustomDomains', () => {
        it('deve listar os domínios da organização', async () => {
            const mockDbData = [
                { id: 'd1', domain: 'um.com', status: 'active', created_at: new Date().toISOString(), verified_at: new Date().toISOString(), target_page_id: 'p1', landing_pages: { name: 'Página Um', slug: 'pagina-um' } },
                { id: 'd2', domain: 'dois.com', status: 'pending', created_at: new Date().toISOString(), verified_at: null, target_page_id: null, landing_pages: null },
            ]
            mockSupabase.order.mockResolvedValue({ data: mockDbData, error: null })

            const result = await listCustomDomains()

            expect(mockSupabase.from).toHaveBeenCalledWith('custom_domains')
            expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', mockOrgId)
            expect(result.error).toBe(null)
            expect(result.domains).toHaveLength(2)
            expect(result.domains[0].domain).toBe('um.com')
            expect(result.domains[1].target).toBe(null)
        })
    })
})
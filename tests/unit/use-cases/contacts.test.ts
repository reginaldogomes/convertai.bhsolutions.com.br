import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreateContactUseCase } from '@/application/use-cases/contacts/create-contact'
import { Contact } from '@/domain/entities/contact'
import type { IContactRepository } from '@/domain/interfaces/contact-repository'

function makeContact(overrides: Partial<ConstructorParameters<typeof Contact>[0]> = {}): Contact {
    return new Contact({
        id: 'c1',
        organizationId: 'org-1',
        name: 'João Silva',
        email: 'joao@test.com',
        phone: '+5531998811678',
        company: null,
        tags: [],
        notes: null,
        createdAt: '2026-01-01T00:00:00Z',
        ...overrides,
    })
}

function makeRepo(overrides: Partial<IContactRepository> = {}): IContactRepository {
    return {
        findByOrgId: vi.fn().mockResolvedValue([]),
        findById: vi.fn(),
        findWithEmailByOrgId: vi.fn(),
        findWithPhoneByOrgId: vi.fn(),
        create: vi.fn().mockResolvedValue(makeContact()),
        update: vi.fn(),
        delete: vi.fn(),
        existsByEmail: vi.fn(),
        countByOrgId: vi.fn(),
        upsertFromLead: vi.fn(),
        ...overrides,
    }
}

describe('CreateContactUseCase', () => {
    let repo: IContactRepository
    let useCase: CreateContactUseCase

    beforeEach(() => {
        repo = makeRepo()
        useCase = new CreateContactUseCase(repo)
    })

    it('creates contact with minimal valid data', async () => {
        const result = await useCase.execute('org-1', { name: 'João Silva' })

        expect(result.ok).toBe(true)
        expect(repo.create).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'João Silva', organizationId: 'org-1' })
        )
    })

    it('creates contact with all fields', async () => {
        const result = await useCase.execute('org-1', {
            name: 'Maria Costa',
            email: 'maria@empresa.com',
            phone: '+5511912345678',
            company: 'Empresa LTDA',
            tags: 'vip, ativo',
            notes: 'Cliente premium',
        })

        expect(result.ok).toBe(true)
        expect(repo.create).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'maria@empresa.com',
                company: 'Empresa LTDA',
                tags: ['vip', 'ativo'],
                notes: 'Cliente premium',
            })
        )
    })

    it('fails when name is too short (< 2 chars)', async () => {
        const result = await useCase.execute('org-1', { name: 'J' })

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.error.code).toBe('VALIDATION_ERROR')
            expect(result.error.message).toContain('2 caracteres')
        }
    })

    it('fails when email is invalid', async () => {
        const result = await useCase.execute('org-1', { name: 'João', email: 'nao-e-email' })

        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR')
    })

    it('accepts empty string as email (no email)', async () => {
        const result = await useCase.execute('org-1', { name: 'João', email: '' })

        expect(result.ok).toBe(true)
        expect(repo.create).toHaveBeenCalledWith(
            expect.objectContaining({ email: null })
        )
    })

    it('parses comma-separated tags into array', async () => {
        await useCase.execute('org-1', { name: 'João', tags: 'lead, vip , ativo' })

        expect(repo.create).toHaveBeenCalledWith(
            expect.objectContaining({ tags: ['lead', 'vip', 'ativo'] })
        )
    })

    it('sets empty tags array when tags not provided', async () => {
        await useCase.execute('org-1', { name: 'João' })

        expect(repo.create).toHaveBeenCalledWith(
            expect.objectContaining({ tags: [] })
        )
    })

    it('returns error when repo.create returns null', async () => {
        vi.mocked(repo.create).mockResolvedValueOnce(null)
        const result = await useCase.execute('org-1', { name: 'João' })

        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR')
    })

    it('sets null for empty optional fields', async () => {
        await useCase.execute('org-1', { name: 'João', company: '', notes: '' })

        expect(repo.create).toHaveBeenCalledWith(
            expect.objectContaining({ company: null, notes: null })
        )
    })
})

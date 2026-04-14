import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreateDealUseCase, MoveDealUseCase } from '@/application/use-cases/deals'
import { Deal } from '@/domain/entities/deal'
import type { IDealRepository } from '@/domain/interfaces/deal-repository'
import type { PipelineStage } from '@/types/database'

function makeDeal(overrides: Partial<ConstructorParameters<typeof Deal>[0]> = {}): Deal {
    return new Deal({
        id: 'deal-1',
        organizationId: 'org-1',
        contactId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Proposta Teste',
        pipelineStage: 'contato',
        value: 5000,
        status: 'open',
        assignedTo: null,
        createdAt: '2026-01-01T00:00:00Z',
        ...overrides,
    })
}

function makeRepo(overrides: Partial<IDealRepository> = {}): IDealRepository {
    return {
        findByOrgId: vi.fn().mockResolvedValue([]),
        findById: vi.fn(),
        create: vi.fn().mockResolvedValue(makeDeal()),
        update: vi.fn(),
        updateStage: vi.fn().mockResolvedValue(true),
        delete: vi.fn(),
        ...overrides,
    }
}

describe('CreateDealUseCase', () => {
    let repo: IDealRepository
    let useCase: CreateDealUseCase

    beforeEach(() => {
        repo = makeRepo()
        useCase = new CreateDealUseCase(repo)
    })

    it('creates deal with valid data', async () => {
        const result = await useCase.execute('org-1', {
            contactId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Negócio X',
            pipelineStage: 'contato',
            value: 1000,
        })

        expect(result.ok).toBe(true)
        expect(repo.create).toHaveBeenCalledWith(
            expect.objectContaining({
                organizationId: 'org-1',
                title: 'Negócio X',
                value: 1000,
            })
        )
    })

    it('fails with invalid contactId (not a UUID)', async () => {
        const result = await useCase.execute('org-1', {
            contactId: 'not-a-uuid',
            title: 'X',
            pipelineStage: 'contato',
            value: 100,
        })

        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR')
    })

    it('fails when title is too short (< 2 chars)', async () => {
        const result = await useCase.execute('org-1', {
            contactId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'X',
            pipelineStage: 'contato',
            value: 100,
        })

        expect(result.ok).toBe(false)
    })

    it('fails for invalid pipeline stage', async () => {
        const result = await useCase.execute('org-1', {
            contactId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Negócio',
            pipelineStage: 'invalido',
            value: 100,
        })

        expect(result.ok).toBe(false)
    })

    it('fails for negative value', async () => {
        const result = await useCase.execute('org-1', {
            contactId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Negócio',
            pipelineStage: 'contato',
            value: -1,
        })

        expect(result.ok).toBe(false)
    })

    it('accepts zero value', async () => {
        const result = await useCase.execute('org-1', {
            contactId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Negócio Grátis',
            pipelineStage: 'proposta',
            value: 0,
        })

        expect(result.ok).toBe(true)
    })

    it.each<PipelineStage>([
        'novo_lead', 'contato', 'proposta', 'negociacao', 'fechado_ganho', 'fechado_perdido',
    ])('accepts all valid pipeline stages (%s)', async (stage) => {
        const result = await useCase.execute('org-1', {
            contactId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Teste',
            pipelineStage: stage,
            value: 0,
        })

        expect(result.ok).toBe(true)
    })

    it('returns error when repo.create returns null', async () => {
        vi.mocked(repo.create).mockResolvedValueOnce(null)
        const result = await useCase.execute('org-1', {
            contactId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Negócio X',
            pipelineStage: 'contato',
            value: 1000,
        })

        expect(result.ok).toBe(false)
    })
})

describe('MoveDealUseCase', () => {
    let repo: IDealRepository
    let useCase: MoveDealUseCase

    beforeEach(() => {
        repo = makeRepo()
        useCase = new MoveDealUseCase(repo)
    })

    it('moves deal to new stage successfully', async () => {
        const result = await useCase.execute('deal-1', 'proposta', 'org-1')

        expect(result.ok).toBe(true)
        expect(repo.updateStage).toHaveBeenCalledWith('deal-1', 'proposta', 'org-1')
    })

    it('returns error when repo.updateStage returns false', async () => {
        vi.mocked(repo.updateStage).mockResolvedValueOnce(false)
        const result = await useCase.execute('deal-1', 'proposta', 'org-1')

        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR')
    })
})

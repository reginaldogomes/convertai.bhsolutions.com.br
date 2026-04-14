import { describe, it, expect } from 'vitest'
import { success, failure, type Result } from '@/domain/errors/result'
import {
    DomainError,
    NotAuthenticatedError,
    NotAuthorizedError,
    EntityNotFoundError,
    ValidationError,
    OrganizationNotFoundError,
} from '@/domain/errors/domain-error'

describe('Result type', () => {
    describe('success()', () => {
        it('creates a successful result with the given value', () => {
            const r = success(42)
            expect(r.ok).toBe(true)
            if (r.ok) expect(r.value).toBe(42)
        })

        it('supports complex values', () => {
            const val = { id: '1', name: 'Test' }
            const r = success(val)
            if (r.ok) expect(r.value).toEqual(val)
        })

        it('supports null values', () => {
            const r = success(null)
            if (r.ok) expect(r.value).toBeNull()
        })
    })

    describe('failure()', () => {
        it('creates a failed result with the given error', () => {
            const err = new ValidationError('Campo inválido')
            const r = failure(err)
            expect(r.ok).toBe(false)
            if (!r.ok) expect(r.error).toBe(err)
        })
    })

    describe('type narrowing', () => {
        it('ok=true gives access to value', () => {
            const r: Result<string> = success('hello')
            if (r.ok) {
                expect(r.value).toBe('hello')
            }
        })

        it('ok=false gives access to error', () => {
            const r: Result<string> = failure(new EntityNotFoundError('Contato'))
            if (!r.ok) {
                expect(r.error.message).toContain('Contato')
            }
        })
    })
})

describe('DomainError classes', () => {
    it('DomainError has correct code and message', () => {
        const e = new DomainError('Algo deu errado', 'SOME_CODE')
        expect(e.message).toBe('Algo deu errado')
        expect(e.code).toBe('SOME_CODE')
        expect(e.name).toBe('DomainError')
    })

    it('NotAuthenticatedError has NOT_AUTHENTICATED code', () => {
        const e = new NotAuthenticatedError()
        expect(e.code).toBe('NOT_AUTHENTICATED')
        expect(e instanceof DomainError).toBe(true)
        expect(e instanceof Error).toBe(true)
    })

    it('NotAuthorizedError has NOT_AUTHORIZED code', () => {
        const e = new NotAuthorizedError()
        expect(e.code).toBe('NOT_AUTHORIZED')
    })

    it('OrganizationNotFoundError has ORG_NOT_FOUND code', () => {
        const e = new OrganizationNotFoundError()
        expect(e.code).toBe('ORG_NOT_FOUND')
    })

    it('EntityNotFoundError includes entity name in message', () => {
        const e = new EntityNotFoundError('Campanha')
        expect(e.message).toContain('Campanha')
        expect(e.code).toBe('ENTITY_NOT_FOUND')
    })

    it('ValidationError defaults to "Dados inválidos"', () => {
        const e = new ValidationError()
        expect(e.message).toBe('Dados inválidos')
        expect(e.code).toBe('VALIDATION_ERROR')
    })

    it('ValidationError accepts custom message', () => {
        const e = new ValidationError('Nome muito curto')
        expect(e.message).toBe('Nome muito curto')
    })

    it('all errors are instanceof Error', () => {
        const errors = [
            new NotAuthenticatedError(),
            new NotAuthorizedError(),
            new OrganizationNotFoundError(),
            new EntityNotFoundError('X'),
            new ValidationError(),
        ]
        errors.forEach(e => expect(e instanceof Error).toBe(true))
    })
})

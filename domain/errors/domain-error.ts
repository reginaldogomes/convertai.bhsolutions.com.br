export class DomainError extends Error {
    constructor(
        message: string,
        public readonly code: string,
    ) {
        super(message)
        this.name = 'DomainError'
    }
}

export class NotAuthenticatedError extends DomainError {
    constructor() {
        super('Não autenticado', 'NOT_AUTHENTICATED')
    }
}

export class NotAuthorizedError extends DomainError {
    constructor() {
        super('Sem permissão para esta ação', 'NOT_AUTHORIZED')
    }
}

export class OrganizationNotFoundError extends DomainError {
    constructor() {
        super('Organização não encontrada', 'ORG_NOT_FOUND')
    }
}

export class EntityNotFoundError extends DomainError {
    constructor(entity: string) {
        super(`${entity} não encontrado(a)`, 'ENTITY_NOT_FOUND')
    }
}

export class ValidationError extends DomainError {
    constructor(message = 'Dados inválidos') {
        super(message, 'VALIDATION_ERROR')
    }
}

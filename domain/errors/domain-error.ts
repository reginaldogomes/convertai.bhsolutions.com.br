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

export class ConflictError extends DomainError {
    constructor(message = 'Já existe um registro com esses dados') {
        super(message, 'CONFLICT')
    }
}

export class LimitExceededError extends DomainError {
    constructor(resource = 'recurso') {
        super(`Limite de ${resource} do plano atingido`, 'LIMIT_EXCEEDED')
    }
}

export class InsufficientCreditsError extends DomainError {
    constructor() {
        super('Créditos insuficientes para realizar esta operação', 'INSUFFICIENT_CREDITS')
    }
}

export class ExternalServiceError extends DomainError {
    constructor(service = 'serviço externo') {
        super(`Falha ao comunicar com ${service}`, 'EXTERNAL_SERVICE')
    }
}

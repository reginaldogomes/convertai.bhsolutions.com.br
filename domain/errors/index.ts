export {
    DomainError,
    NotAuthenticatedError,
    NotAuthorizedError,
    OrganizationNotFoundError,
    EntityNotFoundError,
    ValidationError,
    ConflictError,
    LimitExceededError,
    InsufficientCreditsError,
    ExternalServiceError,
} from './domain-error'
export { type Result, success, failure } from './result'

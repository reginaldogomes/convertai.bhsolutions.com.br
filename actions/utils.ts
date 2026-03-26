import { NotAuthenticatedError, OrganizationNotFoundError } from '@/domain/errors'

export function getErrorMessage(error: unknown): string {
    if (error instanceof NotAuthenticatedError || error instanceof OrganizationNotFoundError) {
        return 'Não autenticado'
    }
    return error instanceof Error ? error.message : 'Erro interno do servidor'
}

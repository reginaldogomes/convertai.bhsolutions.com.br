import { DomainError } from '@/domain/errors'

export type ErrorPayload = { message: string; code: string | null }

/**
 * Mapeamento centralizado: código de erro de domínio → mensagem pt-BR segura para o cliente.
 * Erros com mensagem variável (VALIDATION_ERROR, ENTITY_NOT_FOUND) usam error.message diretamente
 * pois são criados com mensagens já traduzidas nos use cases.
 */
const DOMAIN_ERROR_MESSAGES: Record<string, string | null> = {
    NOT_AUTHENTICATED:    'Sessão expirada. Faça login novamente.',
    NOT_AUTHORIZED:       'Você não tem permissão para realizar esta ação.',
    ORG_NOT_FOUND:        'Organização não encontrada.',
    ENTITY_NOT_FOUND:     null, // usa error.message ("Campanha não encontrada", etc.)
    VALIDATION_ERROR:     null, // usa error.message ("Nome é obrigatório", etc.)
    CONFLICT:             'Já existe um registro com esses dados.',
    LIMIT_EXCEEDED:       null, // usa error.message ("Limite de contatos do plano atingido")
    INSUFFICIENT_CREDITS: 'Créditos insuficientes. Adquira mais créditos para continuar.',
    EXTERNAL_SERVICE:     'Serviço externo indisponível. Tente novamente em instantes.',
}

/**
 * Converte qualquer erro em mensagem segura para exibição no cliente.
 *
 * - DomainError conhecido → mensagem mapeada (ou error.message para erros com texto variável)
 * - DomainError desconhecido → error.message (assumindo que foi criado com texto seguro)
 * - Erro inesperado (Supabase, SDK, rede, etc.) → mensagem genérica + log no servidor
 *
 * Retorna um objeto com a mensagem e um código de erro de domínio, se aplicável.
 * Nunca expõe detalhes internos, stack traces ou mensagens de banco de dados.
 */
export function getErrorPayload(error: unknown): ErrorPayload {
    if (error instanceof DomainError) {
        const mapped = DOMAIN_ERROR_MESSAGES[error.code]
        // null = usar error.message (mensagem específica e segura definida no use case)
        if (mapped === null) {
            return { message: error.message, code: error.code }
        }
        // string = mensagem genérica mapeada para o código
        if (mapped) {
            return { message: mapped, code: error.code }
        }
        // código desconhecido — confiar no message do DomainError
        return { message: error.message, code: error.code }
    }

    // Erro inesperado: loga internamente, nunca expõe ao cliente
    console.error('[Server Action] Erro inesperado:', error)
    return {
        message: 'Erro interno do servidor. Tente novamente em instantes.',
        code: 'INTERNAL_SERVER_ERROR',
    }
}

export function getErrorMessage(error: unknown): string {
    return getErrorPayload(error).message
}

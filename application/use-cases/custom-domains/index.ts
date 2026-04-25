import type { ICustomDomainRepository, CreateCustomDomainInput, UpdateCustomDomainInput } from '@/domain/interfaces'
import { DomainError } from '@/domain/errors'
import type { CustomDomain } from '@/domain/entities/custom-domain'
import { resolve } from 'dns/promises'

export class ListCustomDomainsUseCase {
    constructor(private readonly customDomainRepo: ICustomDomainRepository) {}

    async execute(orgId: string): Promise<CustomDomain[]> {
        return this.customDomainRepo.listByOrg(orgId)
    }
}

export class GetCustomDomainUseCase {
    constructor(private readonly customDomainRepo: ICustomDomainRepository) {}

    async execute(orgId: string, domainId: string): Promise<CustomDomain> {
        const domain = await this.customDomainRepo.getById(domainId, orgId)
        if (!domain) {
            throw new DomainError('NOT_FOUND', 'Domínio não encontrado ou você não tem permissão para acessá-lo.')
        }
        return domain
    }
}

export class AddCustomDomainUseCase {
    constructor(private readonly customDomainRepo: ICustomDomainRepository) {}

    async execute(orgId: string, input: CreateCustomDomainInput): Promise<CustomDomain> {
        if (!input.domain || input.domain.trim().length === 0) {
            throw new DomainError('VALIDATION_ERROR', 'O domínio é obrigatório.')
        }

        const domainLower = input.domain.toLowerCase().trim()

        // Validação de formato de domínio
        if (!/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,63}$/.test(domainLower)) {
            throw new DomainError('VALIDATION_ERROR', 'Formato de domínio inválido. Use um domínio válido como exemplo.com')
        }

        // Verifica se domínio já existe na org
        const existing = await this.customDomainRepo.getByDomain(domainLower, orgId)
        if (existing) {
            throw new DomainError('CONFLICT', 'Este domínio já está registrado na sua organização.')
        }

        return this.customDomainRepo.create(orgId, {
            domain: domainLower,
            targetPageId: input.targetPageId,
        })
    }
}

export class UpdateCustomDomainUseCase {
    constructor(private readonly customDomainRepo: ICustomDomainRepository) {}

    async execute(orgId: string, domainId: string, input: UpdateCustomDomainInput): Promise<CustomDomain> {
        const domain = await this.customDomainRepo.getById(domainId, orgId)
        if (!domain) {
            throw new DomainError('NOT_FOUND', 'Domínio não encontrado.')
        }

        return this.customDomainRepo.update(domainId, orgId, input)
    }
}

export class CheckCustomDomainStatusUseCase {
    constructor(private readonly customDomainRepo: ICustomDomainRepository) {}

    async execute(orgId: string, domainId: string, cnameTarget: string = 'cname.convertai.bhsolutions.com.br'): Promise<CustomDomain> {
        const domain = await this.customDomainRepo.getById(domainId, orgId)
        if (!domain) {
            throw new DomainError('NOT_FOUND', 'Domínio não encontrado.')
        }

        let status: 'active' | 'error' | 'pending' = 'pending'
        let verificationDetails: Record<string, unknown> = {}

        try {
            const cnameRecords = await resolve(domain.domain, 'CNAME')
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
                try {
                    const aRecords = await resolve(domain.domain, 'A')
                    if (aRecords.length > 0) {
                        status = 'error'
                        verificationDetails = { reason: 'a_record_found', message: 'Configure um CNAME em vez de um registro A' }
                    }
                } catch {
                    // Se nem A records encontrado, ainda está pending
                }
            } else {
                throw new DomainError('EXTERNAL_SERVICE', 'Erro ao verificar DNS. Tente novamente.')
            }
        }

        return this.customDomainRepo.update(domainId, orgId, {
            status,
            verificationDetails,
        })
    }
}

export class DeleteCustomDomainUseCase {
    constructor(private readonly customDomainRepo: ICustomDomainRepository) {}

    async execute(orgId: string, domainId: string): Promise<void> {
        const domain = await this.customDomainRepo.getById(domainId, orgId)
        if (!domain) {
            throw new DomainError('NOT_FOUND', 'Domínio não encontrado.')
        }

        await this.customDomainRepo.delete(domainId, orgId)
    }
}

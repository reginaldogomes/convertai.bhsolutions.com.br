import type { CustomDomain } from '@/domain/entities/custom-domain'

export interface CreateCustomDomainInput {
    domain: string
    targetPageId?: string | null
}

export interface UpdateCustomDomainInput {
    status?: 'pending' | 'active' | 'error'
    targetPageId?: string | null
    verificationDetails?: Record<string, unknown> | null
}

export interface ICustomDomainRepository {
    listByOrg(orgId: string): Promise<CustomDomain[]>
    getById(id: string, orgId: string): Promise<CustomDomain | null>
    getByDomain(domain: string, orgId: string): Promise<CustomDomain | null>
    create(orgId: string, input: CreateCustomDomainInput): Promise<CustomDomain>
    update(id: string, orgId: string, input: UpdateCustomDomainInput): Promise<CustomDomain>
    delete(id: string, orgId: string): Promise<void>
}

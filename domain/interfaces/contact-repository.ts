import type { Contact } from '@/domain/entities'

export interface CreateContactInput {
    organizationId: string
    name: string
    email: string | null
    phone: string | null
    company: string | null
    tags: string[]
    notes: string | null
}

export interface IContactRepository {
    findById(id: string): Promise<Contact | null>
    findByPhone(phone: string, orgId: string): Promise<Contact | null>
    findByOrgId(orgId: string): Promise<Contact[]>
    findWithEmailByOrgId(orgId: string, tags?: string[]): Promise<{ id: string; name: string; email: string }[]>
    findIdAndNameByOrgId(orgId: string): Promise<{ id: string; name: string }[]>
    create(input: CreateContactInput): Promise<Contact | null>
    countRecentByOrgId(orgId: string, since: string): Promise<number>
}

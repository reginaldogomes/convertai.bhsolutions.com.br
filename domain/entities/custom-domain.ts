import type { DatabaseRow } from '@/types/database'

interface CustomDomainProps {
    id: string
    organizationId: string
    domain: string
    status: 'pending' | 'active' | 'error'
    targetPageId: string | null
    createdAt: Date
    updatedAt: Date | null
    verificationDetails?: Record<string, unknown> | null
}

export class CustomDomain {
    private constructor(private readonly props: CustomDomainProps) {}

    public static fromRow(row: DatabaseRow<'custom_domains'>): CustomDomain {
        return new CustomDomain({
            id: row.id,
            organizationId: row.organization_id,
            domain: row.domain,
            status: row.status as 'pending' | 'active' | 'error',
            targetPageId: row.target_page_id,
            createdAt: new Date(row.created_at),
            updatedAt: row.updated_at ? new Date(row.updated_at) : null,
            verificationDetails: (row as any).verification_details || null,
        })
    }

    get id(): string { return this.props.id }
    get domain(): string { return this.props.domain }
    get status(): 'pending' | 'active' | 'error' { return this.props.status }
    get targetPageId(): string | null { return this.props.targetPageId }
    get createdAt(): Date { return this.props.createdAt }
    get isPending(): boolean { return this.props.status === 'pending' }
    get isActive(): boolean { return this.props.status === 'active' }
    get isError(): boolean { return this.props.status === 'error' }
}

export interface ContactProps {
    id: string
    organizationId: string
    name: string
    email: string | null
    phone: string | null
    company: string | null
    tags: string[]
    notes: string | null
    createdAt: string
}

export class Contact {
    constructor(public readonly props: ContactProps) {}

    get id() { return this.props.id }
    get organizationId() { return this.props.organizationId }
    get name() { return this.props.name }
    get email() { return this.props.email }
    get phone() { return this.props.phone }
    get company() { return this.props.company }
    get tags() { return this.props.tags }
    get notes() { return this.props.notes }
    get createdAt() { return this.props.createdAt }

    belongsToOrg(orgId: string): boolean {
        return this.organizationId === orgId
    }

    static fromRow(row: {
        id: string
        organization_id: string
        name: string
        email: string | null
        phone: string | null
        company: string | null
        tags: string[]
        notes: string | null
        created_at: string
    }): Contact {
        return new Contact({
            id: row.id,
            organizationId: row.organization_id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            company: row.company,
            tags: row.tags ?? [],
            notes: row.notes,
            createdAt: row.created_at,
        })
    }
}

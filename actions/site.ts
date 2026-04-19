import type { DatabaseRow } from '@/types/database'

interface SiteProps {
    id: string
    organizationId: string
    name: string
    createdAt: Date
    updatedAt: Date | null
}

export class Site {
    private constructor(private readonly props: SiteProps) {}

    public static fromRow(row: DatabaseRow<'sites'>): Site {
        return new Site({
            id: row.id,
            organizationId: row.organization_id,
            name: row.name,
            createdAt: new Date(row.created_at),
            updatedAt: row.updated_at ? new Date(row.updated_at) : null,
        })
    }

    get id(): string { return this.props.id }
    get name(): string { return this.props.name }
    get createdAt(): Date { return this.props.createdAt }
}
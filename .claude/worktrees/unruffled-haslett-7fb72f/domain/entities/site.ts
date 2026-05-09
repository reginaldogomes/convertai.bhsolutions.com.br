import type { DatabaseRow } from '@/types/database'

interface SiteProps {
    id: string
    organizationId: string
    name: string
    slug: string
    configJson: Record<string, any>
    primaryColor: string | null
    logoUrl: string | null
    description: string | null
    theme: string | null
    status: string | null
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
            slug: row.slug,
            configJson: (row.config_json as Record<string, any>) || {},
            primaryColor: row.primary_color,
            logoUrl: row.logo_url,
            description: row.description,
            theme: row.theme,
            status: row.status,
            createdAt: new Date(row.created_at),
            updatedAt: row.updated_at ? new Date(row.updated_at) : null,
        })
    }

    get id(): string { return this.props.id }
    get organizationId(): string { return this.props.organizationId }
    get name(): string { return this.props.name }
    get slug(): string { return this.props.slug }
    get configJson(): Record<string, any> { return this.props.configJson }
    get primaryColor(): string | null { return this.props.primaryColor }
    get logoUrl(): string | null { return this.props.logoUrl }
    get description(): string | null { return this.props.description }
    get theme(): string | null { return this.props.theme }
    get status(): string | null { return this.props.status }
    get createdAt(): Date { return this.props.createdAt }
}

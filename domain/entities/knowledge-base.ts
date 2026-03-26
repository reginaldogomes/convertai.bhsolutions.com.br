export interface KnowledgeBaseProps {
    id: string
    organizationId: string
    landingPageId: string | null
    title: string
    content: string
    metadataJson: Record<string, unknown>
    createdAt: string
}

export class KnowledgeBase {
    constructor(public readonly props: KnowledgeBaseProps) {}

    get id() { return this.props.id }
    get organizationId() { return this.props.organizationId }
    get landingPageId() { return this.props.landingPageId }
    get title() { return this.props.title }
    get content() { return this.props.content }
    get metadataJson() { return this.props.metadataJson }
    get createdAt() { return this.props.createdAt }

    static fromRow(row: {
        id: string
        organization_id: string
        landing_page_id: string | null
        title: string
        content: string
        metadata_json: unknown
        created_at: string
    }): KnowledgeBase {
        return new KnowledgeBase({
            id: row.id,
            organizationId: row.organization_id,
            landingPageId: row.landing_page_id,
            title: row.title,
            content: row.content,
            metadataJson: (row.metadata_json as Record<string, unknown>) ?? {},
            createdAt: row.created_at,
        })
    }
}

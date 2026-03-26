import type { CampaignStatus } from '@/types/database'

export interface CampaignProps {
    id: string
    organizationId: string
    name: string
    subject: string
    body: string
    status: CampaignStatus
    sentAt: string | null
    metrics: CampaignMetrics
    createdAt: string
}

export interface CampaignMetrics {
    open_rate: number
    click_rate: number
    bounce_rate: number
    total_sent: number
    total_failed: number
}

const DEFAULT_METRICS: CampaignMetrics = {
    open_rate: 0,
    click_rate: 0,
    bounce_rate: 0,
    total_sent: 0,
    total_failed: 0,
}

export class Campaign {
    constructor(public readonly props: CampaignProps) {}

    get id() { return this.props.id }
    get organizationId() { return this.props.organizationId }
    get name() { return this.props.name }
    get subject() { return this.props.subject }
    get body() { return this.props.body }
    get status() { return this.props.status }
    get sentAt() { return this.props.sentAt }
    get metrics() { return this.props.metrics }
    get createdAt() { return this.props.createdAt }

    isDraft(): boolean {
        return this.status === 'draft'
    }

    isSent(): boolean {
        return this.status === 'sent'
    }

    canSend(): boolean {
        return this.isDraft() && this.subject.length > 0 && this.body.length > 0
    }

    canResend(): boolean {
        return this.isSent() && this.subject.length > 0 && this.body.length > 0
    }

    static fromRow(row: {
        id: string
        organization_id: string
        name: string
        subject: string
        body: string
        status: string
        sent_at: string | null
        metrics: unknown
        created_at: string
    }): Campaign {
        const rawMetrics = row.metrics as Record<string, number> | null
        return new Campaign({
            id: row.id,
            organizationId: row.organization_id,
            name: row.name,
            subject: row.subject,
            body: row.body,
            status: row.status as CampaignStatus,
            sentAt: row.sent_at,
            metrics: {
                open_rate: rawMetrics?.open_rate ?? 0,
                click_rate: rawMetrics?.click_rate ?? 0,
                bounce_rate: rawMetrics?.bounce_rate ?? 0,
                total_sent: rawMetrics?.total_sent ?? 0,
                total_failed: rawMetrics?.total_failed ?? 0,
            },
            createdAt: row.created_at,
        })
    }
}

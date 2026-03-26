import type { PipelineStage } from '@/types/database'

export interface DealProps {
    id: string
    organizationId: string
    contactId: string
    title: string
    pipelineStage: PipelineStage
    value: number
    status: 'open' | 'won' | 'lost'
    assignedTo: string | null
    createdAt: string
    contactName?: string
    contactCompany?: string | null
}

const STAGE_ORDER: PipelineStage[] = [
    'novo_lead', 'contato', 'proposta', 'negociacao', 'fechado_ganho', 'fechado_perdido'
]

export class Deal {
    constructor(public readonly props: DealProps) {}

    get id() { return this.props.id }
    get organizationId() { return this.props.organizationId }
    get contactId() { return this.props.contactId }
    get title() { return this.props.title }
    get pipelineStage() { return this.props.pipelineStage }
    get value() { return this.props.value }
    get status() { return this.props.status }
    get createdAt() { return this.props.createdAt }
    get contactName() { return this.props.contactName }
    get contactCompany() { return this.props.contactCompany }
    get assignedTo() { return this.props.assignedTo }

    belongsToOrg(orgId: string): boolean {
        return this.organizationId === orgId
    }

    isWon(): boolean {
        return this.status === 'won'
    }

    stageLabel(): string {
        return this.pipelineStage.replace(/_/g, ' ')
    }

    static stageOrder(): PipelineStage[] {
        return STAGE_ORDER
    }

    static fromRow(row: {
        id: string
        organization_id: string
        contact_id: string
        title: string
        pipeline_stage: PipelineStage
        value: number
        status: 'open' | 'won' | 'lost'
        assigned_to: string | null
        created_at: string
        contacts?: { name: string; company: string | null } | null
    }): Deal {
        return new Deal({
            id: row.id,
            organizationId: row.organization_id,
            contactId: row.contact_id,
            title: row.title,
            pipelineStage: row.pipeline_stage,
            value: Number(row.value),
            status: row.status,
            assignedTo: row.assigned_to,
            createdAt: row.created_at,
            contactName: row.contacts?.name,
            contactCompany: row.contacts?.company,
        })
    }
}

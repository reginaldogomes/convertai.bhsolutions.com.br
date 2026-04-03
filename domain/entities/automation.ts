import type { AutomationWorkflow } from '@/domain/interfaces/automation-repository'
import type { Json } from '@/types/database'

export interface AutomationProps {
    id: string
    organizationId: string
    name: string
    triggerEvent: string
    workflowJson: AutomationWorkflow
    active: boolean
    createdAt: string
}

export class Automation {
    constructor(public readonly props: AutomationProps) {}

    get id() { return this.props.id }
    get organizationId() { return this.props.organizationId }
    get name() { return this.props.name }
    get triggerEvent() { return this.props.triggerEvent }
    get workflowJson() { return this.props.workflowJson }
    get active() { return this.props.active }
    get createdAt() { return this.props.createdAt }

    isActive(): boolean { return this.props.active }

    belongsToOrg(orgId: string): boolean {
        return this.organizationId === orgId
    }

    stepCount(): number {
        return this.workflowJson.steps.length
    }

    static fromRow(row: {
        id: string
        organization_id: string
        name: string
        trigger_event: string
        workflow_json: Json
        active: boolean
        created_at: string
    }): Automation {
        return new Automation({
            id: row.id,
            organizationId: row.organization_id,
            name: row.name,
            triggerEvent: row.trigger_event,
            workflowJson: row.workflow_json as unknown as AutomationWorkflow,
            active: row.active,
            createdAt: row.created_at,
        })
    }
}

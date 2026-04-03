import type { Automation } from '@/domain/entities/automation'

export interface AutomationStep {
    type: 'send_whatsapp' | 'send_email' | 'send_sms' | 'add_tag' | 'assign_agent' | 'wait'
    config: Record<string, unknown>
}

export interface AutomationWorkflow {
    steps: AutomationStep[]
}

export interface AutomationRow {
    id: string
    organization_id: string
    name: string
    trigger_event: string
    workflow_json: AutomationWorkflow
    active: boolean
    created_at: string
}

export interface CreateAutomationInput {
    organizationId: string
    name: string
    triggerEvent: string
    workflowJson: AutomationWorkflow
}

export interface UpdateAutomationInput {
    name?: string
    triggerEvent?: string
    workflowJson?: AutomationWorkflow
    active?: boolean
}

export interface IAutomationRepository {
    findByOrgId(orgId: string): Promise<Automation[]>
    findById(id: string, orgId: string): Promise<Automation | null>
    create(input: CreateAutomationInput): Promise<Automation | null>
    update(id: string, orgId: string, input: UpdateAutomationInput): Promise<Automation | null>
    delete(id: string, orgId: string): Promise<boolean>
    toggleActive(id: string, orgId: string, active: boolean): Promise<boolean>
}

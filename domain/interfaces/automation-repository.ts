export interface AutomationRow {
    id: string
    organization_id: string
    name: string
    trigger_event: string
    workflow_json: unknown
    active: boolean
    created_at: string
}

export interface IAutomationRepository {
    findByOrgId(orgId: string): Promise<AutomationRow[]>
}

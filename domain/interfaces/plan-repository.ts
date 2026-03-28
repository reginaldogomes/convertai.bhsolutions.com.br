import type { PlanConfig, PlanLimits, PlanUsage, ResourceKey } from '../entities/plan'

export interface OrgLimitsAndUsage {
    plan: string
    limits: PlanLimits
    usage: PlanUsage
    hasOverride: boolean
}

export interface IPlanRepository {
    getAllPlans(): Promise<PlanConfig[]>
    getPlanById(planId: string): Promise<PlanConfig | null>
    updatePlanLimits(planId: string, updates: Partial<PlanLimits> & { name?: string; priceBrl?: number }): Promise<void>
    getEffectiveLimits(orgId: string): Promise<PlanLimits & { plan: string }>
    getOrgUsage(orgId: string): Promise<PlanUsage>
    getOrgOverride(orgId: string): Promise<(Partial<PlanLimits> & { notes?: string }) | null>
    setOrgOverride(orgId: string, overrides: Partial<PlanLimits> & { notes?: string }): Promise<void>
    clearOrgOverride(orgId: string): Promise<void>
    countResource(orgId: string, resource: ResourceKey): Promise<number>
}

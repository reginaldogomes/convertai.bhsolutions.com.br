import type { IPlanRepository, OrgLimitsAndUsage } from '@/domain/interfaces/plan-repository'
import type { PlanConfig, PlanLimits, LimitCheckResult, ResourceKey } from '@/domain/entities/plan'
import { RESOURCE_LABELS, isUnlimited } from '@/domain/entities/plan'

// --- Check Limit ---

export class CheckLimitUseCase {
    constructor(private readonly planRepo: IPlanRepository) {}

    async execute(orgId: string, resource: ResourceKey, additionalCount = 1): Promise<LimitCheckResult> {
        const [effectiveLimits, current] = await Promise.all([
            this.planRepo.getEffectiveLimits(orgId),
            this.planRepo.countResource(orgId, resource),
        ])

        const limit = getLimitForResource(effectiveLimits, resource)

        return {
            allowed: isUnlimited(limit) || current + additionalCount <= limit,
            current,
            limit,
            label: RESOURCE_LABELS[resource],
        }
    }
}

// --- Get Org Limits & Usage ---

export class GetOrgLimitsAndUsageUseCase {
    constructor(private readonly planRepo: IPlanRepository) {}

    async execute(orgId: string): Promise<OrgLimitsAndUsage> {
        const [effectiveLimits, usage, override] = await Promise.all([
            this.planRepo.getEffectiveLimits(orgId),
            this.planRepo.getOrgUsage(orgId),
            this.planRepo.getOrgOverride(orgId),
        ])
        const { plan, ...limits } = effectiveLimits
        return { plan, limits, usage, hasOverride: override !== null }
    }
}

// --- Get All Plans (admin) ---

export class GetAllPlansUseCase {
    constructor(private readonly planRepo: IPlanRepository) {}

    async execute(): Promise<PlanConfig[]> {
        return this.planRepo.getAllPlans()
    }
}

// --- Update Plan Limits (admin) ---

export class UpdatePlanLimitsUseCase {
    constructor(private readonly planRepo: IPlanRepository) {}

    async execute(planId: string, updates: Partial<PlanLimits> & { name?: string; priceBrl?: number }): Promise<void> {
        return this.planRepo.updatePlanLimits(planId, updates)
    }
}

// --- Get Org Override (admin) ---

export class GetOrgOverrideUseCase {
    constructor(private readonly planRepo: IPlanRepository) {}

    async execute(orgId: string): Promise<(Partial<PlanLimits> & { notes?: string }) | null> {
        return this.planRepo.getOrgOverride(orgId)
    }
}

// --- Set Org Override (admin) ---

export class SetOrgOverrideUseCase {
    constructor(private readonly planRepo: IPlanRepository) {}

    async execute(orgId: string, overrides: Partial<PlanLimits> & { notes?: string }): Promise<void> {
        return this.planRepo.setOrgOverride(orgId, overrides)
    }
}

// --- Clear Org Override (admin) ---

export class ClearOrgOverrideUseCase {
    constructor(private readonly planRepo: IPlanRepository) {}

    async execute(orgId: string): Promise<void> {
        return this.planRepo.clearOrgOverride(orgId)
    }
}

// --- Helpers ---

function getLimitForResource(limits: PlanLimits, resource: ResourceKey): number {
    switch (resource) {
        case 'contacts': return limits.contactsLimit
        case 'landing_pages': return limits.landingPagesLimit
        case 'emails_monthly': return limits.emailsMonthlyLimit
        case 'whatsapp_monthly': return limits.whatsappMonthlyLimit
        case 'automations': return limits.automationsLimit
        case 'knowledge_base': return limits.knowledgeBaseLimit
    }
}

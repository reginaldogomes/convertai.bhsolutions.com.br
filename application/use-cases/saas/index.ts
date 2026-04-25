import { z } from 'zod'
import { type Result, success, failure, ValidationError, EntityNotFoundError } from '@/domain/errors'
import type { IPlanRepository, ISubscriptionRepository, ICreditRepository } from '@/domain/interfaces'
import { Plan, Subscription, CreditPack, CreditTransaction } from '@/domain/entities'
import type { PlanId } from '@/types/database'

// --- Get All Plans ---

export class GetPlansUseCase {
    constructor(private readonly planRepo: IPlanRepository) {}

    async execute(): Promise<Result<Plan[]>> {
        const plans = await this.planRepo.findAll()
        return success(plans)
    }
}

// --- Get Subscription ---

export class GetSubscriptionUseCase {
    constructor(private readonly subscriptionRepo: ISubscriptionRepository) {}

    async execute(orgId: string): Promise<Result<Subscription | null>> {
        const subscription = await this.subscriptionRepo.findByOrgId(orgId)
        return success(subscription)
    }
}

// --- Get Credit Transactions ---

export class GetCreditTransactionsUseCase {
    constructor(private readonly creditRepo: ICreditRepository) {}

    async execute(orgId: string, limit?: number): Promise<Result<CreditTransaction[]>> {
        const transactions = await this.creditRepo.listTransactions(orgId, limit)
        return success(transactions)
    }
}

// --- Get Credit Packs ---

export class GetCreditPacksUseCase {
    constructor(private readonly creditRepo: ICreditRepository) {}

    async execute(): Promise<Result<CreditPack[]>> {
        const packs = await this.creditRepo.listPacks()
        return success(packs)
    }
}

// --- Change Plan (admin action) ---

const changePlanSchema = z.object({
    planId: z.enum(['starter', 'pro', 'enterprise']),
    notes: z.string().max(500).optional(),
})

export class ChangePlanUseCase {
    constructor(
        private readonly planRepo: IPlanRepository,
        private readonly subscriptionRepo: ISubscriptionRepository,
        private readonly creditRepo: ICreditRepository,
    ) {}

    async execute(orgId: string, input: { planId: PlanId; notes?: string }): Promise<Result<Subscription>> {
        const parsed = changePlanSchema.safeParse(input)
        if (!parsed.success) {
            return failure(new ValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos'))
        }

        const plan = await this.planRepo.findById(parsed.data.planId)
        if (!plan) {
            return failure(new EntityNotFoundError('Plano não encontrado'))
        }

        const subscription = await this.subscriptionRepo.update(orgId, {
            planId: parsed.data.planId,
            status: 'active',
            notes: parsed.data.notes,
        })
        if (!subscription) {
            return failure(new EntityNotFoundError('Assinatura não encontrada'))
        }

        // Credit plan monthly credits on plan change
        await this.creditRepo.add(
            orgId,
            plan.monthlyCredits,
            'plan_renewal',
            `Troca para plano ${plan.name}`,
        )

        return success(subscription)
    }
}

// --- Grant Credits (admin action) ---

const grantCreditsSchema = z.object({
    amount: z.number().int().min(1).max(1000000),
    reason: z.string().min(1).max(500),
})

export class GrantCreditsUseCase {
    constructor(private readonly creditRepo: ICreditRepository) {}

    async execute(
        orgId: string,
        input: { amount: number; reason: string },
        grantedBy: string,
    ): Promise<Result<number>> {
        const parsed = grantCreditsSchema.safeParse(input)
        if (!parsed.success) {
            return failure(new ValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos'))
        }

        const newBalance = await this.creditRepo.add(
            orgId,
            parsed.data.amount,
            'admin_grant',
            parsed.data.reason,
            undefined,
            grantedBy,
        )

        return success(newBalance)
    }
}

export class GrantCreditsFromPackUseCase {
    constructor(private readonly creditRepo: ICreditRepository) {}

    async execute(orgId: string, userId: string, packId: string): Promise<Result<number>> {
        const packs = await this.creditRepo.listPacks()
        const pack = packs.find((item) => item.id === packId)
        if (!pack) {
            return failure(new EntityNotFoundError('Pacote de créditos'))
        }

        const newBalance = await this.creditRepo.add(
            orgId,
            pack.credits,
            'purchase',
            `Compra do pacote ${pack.name}`,
            packId,
            userId,
        )

        return success(newBalance)
    }
}

// --- List All Subscriptions (super admin) ---

export class ListAllSubscriptionsUseCase {
    constructor(private readonly subscriptionRepo: ISubscriptionRepository) {}

    async execute(): Promise<Result<Array<{
        orgId: string
        orgName: string
        planId: PlanId
        planName: string
        status: string
        creditsBalance: number
        currentPeriodEnd: string
    }>>> {
        const list = await this.subscriptionRepo.listAllWithOrgInfo()
        return success(list)
    }
}

// --- Get All Plans (admin, including inactive) ---

export class ListAllPlansAdminUseCase {
    constructor(private readonly planRepo: IPlanRepository) {}

    async execute(): Promise<Result<Plan[]>> {
        const plans = await this.planRepo.findAllAdmin()
        return success(plans)
    }
}

// --- Get Plan By ID ---

export class GetPlanByIdUseCase {
    constructor(private readonly planRepo: IPlanRepository) {}

    async execute(id: string): Promise<Result<Plan | null>> {
        const plan = await this.planRepo.findById(id as PlanId)
        return success(plan)
    }
}

// --- Upsert Plan (admin) ---

const upsertPlanSchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional().default(''),
    priceBrl: z.number().min(0),
    monthlyCredits: z.number().int().min(0),
    maxContacts: z.number().int().min(-1),
    maxLandingPages: z.number().int().min(-1),
    maxUsers: z.number().int().min(-1),
    maxAutomations: z.number().int().min(-1),
    features: z.array(z.string()),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().min(0).default(0),
})

export class UpsertPlanUseCase {
    constructor(private readonly planRepo: IPlanRepository) {}

    async execute(input: {
        id?: string
        name: string
        description?: string
        priceBrl: number
        monthlyCredits: number
        maxContacts: number
        maxLandingPages: number
        maxUsers: number
        maxAutomations: number
        features: string[]
        isActive: boolean
        sortOrder: number
    }): Promise<Result<Plan>> {
        const parsed = upsertPlanSchema.safeParse(input)
        if (!parsed.success) {
            return failure(new ValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos'))
        }

        const plan = await this.planRepo.upsert({
            ...(input.id ? { id: input.id } : {}),
            ...parsed.data,
        })

        return success(plan)
    }
}

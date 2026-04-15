import type { Plan, PlanProps } from '@/domain/entities/plan'
import type { PlanId } from '@/types/database'

export type UpsertPlanInput = Omit<PlanProps, 'id'> & { id?: string }

export interface IPlanRepository {
    findAll(): Promise<Plan[]>
    findAllAdmin(): Promise<Plan[]>
    findById(id: PlanId): Promise<Plan | null>
    upsert(input: UpsertPlanInput): Promise<Plan>
}

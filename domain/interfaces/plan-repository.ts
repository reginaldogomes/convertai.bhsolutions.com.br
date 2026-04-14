import type { Plan } from '@/domain/entities/plan'
import type { PlanId } from '@/types/database'

export interface IPlanRepository {
    findAll(): Promise<Plan[]>
    findById(id: PlanId): Promise<Plan | null>
}

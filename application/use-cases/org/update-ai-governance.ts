import { updatePolicy } from '@/lib/ai-governance'
import { Result, success, failure } from '@/domain/errors'

export class UpdateAiGovernanceUseCase {
    async execute(orgId: string, input: {
        dailyRequestsLimit: number
        monthlyBudgetCents: number
        hardBlockEnabled: boolean
    }): Promise<Result<boolean>> {
        try {
            await updatePolicy(orgId, {
                dailyRequestsLimit: input.dailyRequestsLimit,
                monthlyBudgetCents: input.monthlyBudgetCents,
                hardBlockEnabled: input.hardBlockEnabled
            })
            return success(true)
        } catch (error: any) {
            return failure(new Error(error.message || 'Falha ao atualizar política de IA'))
        }
    }
}

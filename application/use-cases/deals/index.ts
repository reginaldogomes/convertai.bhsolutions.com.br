import { z } from 'zod'
import { type Result, success, failure, ValidationError } from '@/domain/errors'
import type { IDealRepository } from '@/domain/interfaces'
import type { Deal } from '@/domain/entities'
import type { PipelineStage } from '@/types/database'

const createDealSchema = z.object({
    contactId: z.string().uuid(),
    title: z.string().min(2),
    pipelineStage: z.enum(['novo_lead', 'contato', 'proposta', 'negociacao', 'fechado_ganho', 'fechado_perdido']),
    value: z.coerce.number().min(0),
})

export class CreateDealUseCase {
    constructor(private readonly dealRepo: IDealRepository) {}

    async execute(orgId: string, input: {
        contactId: string
        title: string
        pipelineStage: string
        value: number
    }): Promise<Result<Deal>> {
        const parsed = createDealSchema.safeParse(input)
        if (!parsed.success) return failure(new ValidationError('Dados inválidos'))

        const deal = await this.dealRepo.create({
            organizationId: orgId,
            contactId: parsed.data.contactId,
            title: parsed.data.title,
            pipelineStage: parsed.data.pipelineStage,
            value: parsed.data.value,
        })

        if (!deal) return failure(new ValidationError('Erro ao criar deal'))
        return success(deal)
    }
}

export class MoveDealUseCase {
    constructor(private readonly dealRepo: IDealRepository) {}

    async execute(dealId: string, stage: PipelineStage, orgId: string): Promise<Result<void>> {
        const updated = await this.dealRepo.updateStage(dealId, stage, orgId)
        if (!updated) return failure(new ValidationError('Erro ao mover deal'))
        return success(undefined)
    }
}

export class ListDealsUseCase {
    constructor(private readonly dealRepo: IDealRepository) {}

    async execute(orgId: string) {
        return this.dealRepo.findByOrgId(orgId)
    }
}

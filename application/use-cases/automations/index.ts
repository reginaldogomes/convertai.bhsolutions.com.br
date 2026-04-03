import { z } from 'zod'
import { type Result, success, failure, ValidationError } from '@/domain/errors'
import type { IAutomationRepository, AutomationWorkflow } from '@/domain/interfaces'
import type { Automation } from '@/domain/entities'

export const TRIGGER_EVENTS = [
    { value: 'new_contact', label: 'Novo contato criado' },
    { value: 'new_deal', label: 'Novo negócio criado' },
    { value: 'deal_won', label: 'Negócio ganho' },
    { value: 'deal_lost', label: 'Negócio perdido' },
    { value: 'contact_tag_added', label: 'Tag adicionada ao contato' },
    { value: 'message_received', label: 'Mensagem recebida' },
    { value: 'form_submitted', label: 'Formulário enviado (landing page)' },
] as const

export type TriggerEvent = (typeof TRIGGER_EVENTS)[number]['value']

const automationSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
    triggerEvent: z.string().min(1, 'Selecione um gatilho'),
    workflowJson: z.object({
        steps: z.array(z.object({
            type: z.enum(['send_whatsapp', 'send_email', 'add_tag', 'assign_agent', 'wait']),
            config: z.record(z.string(), z.unknown()),
        })).min(1, 'Adicione pelo menos um passo'),
    }),
})

// --- List Automations ---

export class ListAutomationsUseCase {
    constructor(private readonly automationRepo: IAutomationRepository) {}

    async execute(orgId: string): Promise<Automation[]> {
        return this.automationRepo.findByOrgId(orgId)
    }
}

// --- Get Automation ---

export class GetAutomationUseCase {
    constructor(private readonly automationRepo: IAutomationRepository) {}

    async execute(id: string, orgId: string): Promise<Automation | null> {
        return this.automationRepo.findById(id, orgId)
    }
}

// --- Create Automation ---

export class CreateAutomationUseCase {
    constructor(private readonly automationRepo: IAutomationRepository) {}

    async execute(orgId: string, input: {
        name: string
        triggerEvent: string
        workflowJson: AutomationWorkflow
    }): Promise<Result<Automation>> {
        const parsed = automationSchema.safeParse(input)
        if (!parsed.success) {
            return failure(new ValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos'))
        }

        const automation = await this.automationRepo.create({
            organizationId: orgId,
            name: parsed.data.name,
            triggerEvent: parsed.data.triggerEvent,
            workflowJson: parsed.data.workflowJson,
        })

        if (!automation) return failure(new ValidationError('Erro ao criar automação'))
        return success(automation)
    }
}

// --- Update Automation ---

const updateSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    triggerEvent: z.string().min(1).optional(),
    workflowJson: z.object({
        steps: z.array(z.object({
            type: z.enum(['send_whatsapp', 'send_email', 'add_tag', 'assign_agent', 'wait']),
            config: z.record(z.string(), z.unknown()),
        })).min(1),
    }).optional(),
})

export class UpdateAutomationUseCase {
    constructor(private readonly automationRepo: IAutomationRepository) {}

    async execute(id: string, orgId: string, input: {
        name?: string
        triggerEvent?: string
        workflowJson?: AutomationWorkflow
    }): Promise<Result<Automation>> {
        const parsed = updateSchema.safeParse(input)
        if (!parsed.success) {
            return failure(new ValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos'))
        }

        const automation = await this.automationRepo.update(id, orgId, parsed.data)
        if (!automation) return failure(new ValidationError('Automação não encontrada'))
        return success(automation)
    }
}

// --- Toggle Active ---

export class ToggleAutomationUseCase {
    constructor(private readonly automationRepo: IAutomationRepository) {}

    async execute(id: string, orgId: string, active: boolean): Promise<Result<boolean>> {
        const ok = await this.automationRepo.toggleActive(id, orgId, active)
        if (!ok) return failure(new ValidationError('Erro ao atualizar automação'))
        return success(true)
    }
}

// --- Delete Automation ---

export class DeleteAutomationUseCase {
    constructor(private readonly automationRepo: IAutomationRepository) {}

    async execute(id: string, orgId: string): Promise<Result<boolean>> {
        const ok = await this.automationRepo.delete(id, orgId)
        if (!ok) return failure(new ValidationError('Erro ao excluir automação'))
        return success(true)
    }
}

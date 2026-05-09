/**
 * Automation Module Registry — Automations
 *
 * Encapsulates repository singletons and use case factories
 * for the Automation domain.
 */
import { SupabaseAutomationRepository } from '@/infrastructure/repositories'
import {
    ListAutomationsUseCase,
    GetAutomationUseCase,
    CreateAutomationUseCase,
    UpdateAutomationUseCase,
    ToggleAutomationUseCase,
    DeleteAutomationUseCase,
} from '@/application/use-cases/automations'

// Repository singletons
export const automationRepo = new SupabaseAutomationRepository()

// Use case factories
export const automationUseCases = {
    listAutomations: () => new ListAutomationsUseCase(automationRepo),
    getAutomation: () => new GetAutomationUseCase(automationRepo),
    createAutomation: () => new CreateAutomationUseCase(automationRepo),
    updateAutomation: () => new UpdateAutomationUseCase(automationRepo),
    toggleAutomation: () => new ToggleAutomationUseCase(automationRepo),
    deleteAutomation: () => new DeleteAutomationUseCase(automationRepo),
} as const

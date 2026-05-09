/**
 * Organization Module Registry — Users, Members, Settings
 *
 * Encapsulates repository singletons and use case factories
 * for organization management.
 */
import { SupabaseUserRepository } from '@/infrastructure/repositories'
import {
    ListOrgMembersUseCase,
    InviteMemberUseCase,
    UpdateMemberRoleUseCase,
    RemoveMemberUseCase,
    TransferOwnershipUseCase,
} from '@/application/use-cases/members'
import { UpdateAiGovernanceUseCase } from '@/application/use-cases/org/update-ai-governance'
import type { IPlanRepository } from '@/domain/interfaces'

// Repository singletons
export const userRepo = new SupabaseUserRepository()

/**
 * Creates org use cases with injected plan repository.
 * The planRepo is passed in from the container to avoid circular imports.
 */
export function createOrgUseCases(planRepo: IPlanRepository) {
    return {
        listOrgMembers: () => new ListOrgMembersUseCase(userRepo),
        inviteMember: () => new InviteMemberUseCase(userRepo, planRepo),
        updateMemberRole: () => new UpdateMemberRoleUseCase(userRepo),
        removeMember: () => new RemoveMemberUseCase(userRepo),
        transferOwnership: () => new TransferOwnershipUseCase(userRepo),
        updateAiGovernance: () => new UpdateAiGovernanceUseCase(),
    } as const
}

import { z } from 'zod'
import { type Result, success, failure, ValidationError, EntityNotFoundError } from '@/domain/errors'
import type { IUserRepository } from '@/domain/interfaces'
import type { IPlanRepository } from '@/domain/interfaces'
import { OrgMember } from '@/domain/entities/org-member'
import { canDo, hasMinRole } from '@/lib/permissions'
import type { UserRole } from '@/types/database'

// ─── Listar membros da org ────────────────────────────────────────────────────

export class ListOrgMembersUseCase {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(orgId: string): Promise<Result<OrgMember[]>> {
        const members = await this.userRepo.findMembersByOrgId(orgId)
        return success(members)
    }
}

// ─── Convidar membro ──────────────────────────────────────────────────────────

const inviteMemberSchema = z.object({
    email: z.string().email('E-mail inválido'),
    name:  z.string().min(2, 'Nome muito curto').max(100),
    role:  z.enum(['admin', 'agent', 'viewer']),
})

export class InviteMemberUseCase {
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly planRepo: IPlanRepository,
    ) {}

    async execute(
        orgId: string,
        inviterRole: string,
        input: { email: string; name: string; role: UserRole },
    ): Promise<Result<void>> {
        // Verificar permissão do convidante
        if (!canDo(inviterRole, 'inviteMembers')) {
            return failure(new ValidationError('Sem permissão para convidar membros.'))
        }

        // Validar dados
        const parsed = inviteMemberSchema.safeParse(input)
        if (!parsed.success) {
            return failure(new ValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos'))
        }

        // Verificar se e-mail já é membro
        const existing = await this.userRepo.findMembersByOrgId(orgId)
        if (existing.some(m => m.email.toLowerCase() === parsed.data.email.toLowerCase())) {
            return failure(new ValidationError('Este e-mail já é membro da organização.'))
        }

        // Verificar limite do plano (max_users)
        // Obtemos a assinatura via planRepo para verificar max_users
        const memberCount = await this.userRepo.countMembersByOrgId(orgId)
        // Nota: verificação simplificada — o limite real vem da subscription
        // A verificação completa ocorre na action que conhece o plano
        if (memberCount >= 100) {
            return failure(new ValidationError('Limite de usuários atingido.'))
        }

        await this.userRepo.inviteMember(orgId, parsed.data.email, parsed.data.name, parsed.data.role)
        return success(undefined)
    }
}

// ─── Atualizar role de membro ─────────────────────────────────────────────────

const updateRoleSchema = z.object({
    targetUserId: z.string().uuid(),
    role: z.enum(['admin', 'agent', 'viewer']),
})

export class UpdateMemberRoleUseCase {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(
        orgId: string,
        actorUserId: string,
        actorRole: string,
        input: { targetUserId: string; role: UserRole },
    ): Promise<Result<void>> {
        const parsed = updateRoleSchema.safeParse(input)
        if (!parsed.success) {
            return failure(new ValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos'))
        }

        // Não pode alterar a si mesmo
        if (actorUserId === parsed.data.targetUserId) {
            return failure(new ValidationError('Você não pode alterar seu próprio papel.'))
        }

        // Verificar permissão mínima
        if (!canDo(actorRole, 'updateMemberRole')) {
            return failure(new ValidationError('Sem permissão para alterar papéis.'))
        }

        // Buscar membro alvo
        const members = await this.userRepo.findMembersByOrgId(orgId)
        const target = members.find(m => m.id === parsed.data.targetUserId)
        if (!target) {
            return failure(new EntityNotFoundError('Membro não encontrado.'))
        }

        // admin só pode alterar agent/viewer
        if (actorRole === 'admin' && (target.isOwner() || target.isAdmin())) {
            return failure(new ValidationError('Administradores só podem alterar papéis de Agentes e Visualizadores.'))
        }

        await this.userRepo.updateMemberRole(orgId, parsed.data.targetUserId, parsed.data.role)
        return success(undefined)
    }
}

// ─── Remover membro ───────────────────────────────────────────────────────────

export class RemoveMemberUseCase {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(
        orgId: string,
        actorUserId: string,
        actorRole: string,
        targetUserId: string,
    ): Promise<Result<void>> {
        if (!canDo(actorRole, 'removeMember')) {
            return failure(new ValidationError('Sem permissão para remover membros.'))
        }

        if (actorUserId === targetUserId) {
            return failure(new ValidationError('Você não pode remover a si mesmo.'))
        }

        const members = await this.userRepo.findMembersByOrgId(orgId)
        const target = members.find(m => m.id === targetUserId)
        if (!target) {
            return failure(new EntityNotFoundError('Membro não encontrado.'))
        }

        // Não remover owners (a não ser que haja outro owner)
        if (target.isOwner()) {
            const ownerCount = members.filter(m => m.isOwner()).length
            if (ownerCount <= 1) {
                return failure(new ValidationError('Não é possível remover o único proprietário da organização.'))
            }
        }

        // admin não pode remover outros admins
        if (actorRole === 'admin' && (target.isOwner() || target.isAdmin())) {
            return failure(new ValidationError('Administradores só podem remover Agentes e Visualizadores.'))
        }

        await this.userRepo.removeMember(orgId, targetUserId)
        return success(undefined)
    }
}

// ─── Transferir propriedade (owner → outro membro) ───────────────────────────

export class TransferOwnershipUseCase {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(
        orgId: string,
        currentOwnerId: string,
        currentOwnerRole: string,
        newOwnerId: string,
    ): Promise<Result<void>> {
        if (!hasMinRole(currentOwnerRole, 'owner')) {
            return failure(new ValidationError('Apenas o proprietário pode transferir a propriedade.'))
        }

        if (currentOwnerId === newOwnerId) {
            return failure(new ValidationError('Você já é o proprietário.'))
        }

        const members = await this.userRepo.findMembersByOrgId(orgId)
        const target = members.find(m => m.id === newOwnerId)
        if (!target) {
            return failure(new EntityNotFoundError('Membro não encontrado.'))
        }

        // Rebaixa atual owner para admin e promove alvo para owner
        await Promise.all([
            this.userRepo.updateMemberRole(orgId, currentOwnerId, 'admin'),
            this.userRepo.updateMemberRole(orgId, newOwnerId, 'owner'),
        ])

        return success(undefined)
    }
}

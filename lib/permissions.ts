import type { UserRole } from '@/types/database'

// ─── Hierarquia de roles ──────────────────────────────────────────────────────
// owner > admin > agent > viewer

const ROLE_RANK: Record<UserRole, number> = {
    owner:  4,
    admin:  3,
    agent:  2,
    viewer: 1,
}

export function hasMinRole(userRole: string, minRole: UserRole): boolean {
    return (ROLE_RANK[userRole as UserRole] ?? 0) >= ROLE_RANK[minRole]
}

// ─── Mapa de permissões por ação ─────────────────────────────────────────────

export const PERMISSIONS = {
    // Gestão de membros
    inviteMembers:     ['owner', 'admin'] as UserRole[],
    updateMemberRole:  ['owner', 'admin'] as UserRole[],
    removeMember:      ['owner', 'admin'] as UserRole[],

    // Configurações da organização
    updateOrgSettings: ['owner', 'admin'] as UserRole[],

    // Criação de recursos
    createCampaign:    ['owner', 'admin', 'agent'] as UserRole[],
    createContact:     ['owner', 'admin', 'agent'] as UserRole[],
    createDeal:        ['owner', 'admin', 'agent'] as UserRole[],
    sendMessage:       ['owner', 'admin', 'agent'] as UserRole[],

    // Exclusão de recursos (operações destrutivas exigem pelo menos admin)
    deleteContact:     ['owner', 'admin'] as UserRole[],
    deleteCampaign:    ['owner', 'admin'] as UserRole[],
    deleteDeal:        ['owner', 'admin'] as UserRole[],
    deleteAutomation:  ['owner', 'admin'] as UserRole[],
    deleteLandingPage: ['owner', 'admin'] as UserRole[],
    deleteProduct:     ['owner', 'admin'] as UserRole[],

    // Visualização (todos os roles autenticados)
    viewAll:           ['owner', 'admin', 'agent', 'viewer'] as UserRole[],
} as const

export type PermissionKey = keyof typeof PERMISSIONS

/**
 * Verifica se um role tem permissão para uma ação.
 * Usar em use cases e server actions para enforcement de acesso.
 */
export function canDo(role: string, action: PermissionKey): boolean {
    return (PERMISSIONS[action] as string[]).includes(role)
}

/**
 * Retorna o label pt-BR de um role.
 */
export function roleLabel(role: UserRole | string): string {
    const labels: Record<string, string> = {
        owner:  'Proprietário',
        admin:  'Administrador',
        agent:  'Agente',
        viewer: 'Visualizador',
    }
    return labels[role] ?? role
}

/**
 * Retorna as cores TailwindCSS para o badge de um role.
 */
export function roleBadgeClass(role: UserRole | string): string {
    const classes: Record<string, string> = {
        owner:  'bg-amber-500/10 text-amber-500 border-amber-500/30',
        admin:  'bg-primary/10 text-primary border-primary/30',
        agent:  'bg-blue-500/10 text-blue-500 border-blue-500/30',
        viewer: 'bg-muted text-muted-foreground border-border',
    }
    return classes[role] ?? classes.viewer
}

/**
 * Lista de roles disponíveis para exibir em selects.
 * Exclui 'owner' pois a transferência de propriedade é uma operação separada.
 */
export const ASSIGNABLE_ROLES: UserRole[] = ['admin', 'agent', 'viewer']

/**
 * Todos os roles disponíveis (incluindo owner) para exibição.
 */
export const ALL_ROLES: UserRole[] = ['owner', 'admin', 'agent', 'viewer']

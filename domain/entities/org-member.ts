import type { UserRole } from '@/types/database'
import { roleLabel } from '@/lib/permissions'

interface OrgMemberProps {
    id: string
    organizationId: string
    name: string
    email: string
    role: UserRole
    avatarUrl: string | null
    createdAt: string
}

export class OrgMember {
    private constructor(private readonly props: OrgMemberProps) {}

    static fromRow(row: {
        id: string
        organization_id: string
        name: string
        email: string
        role: string
        avatar_url?: string | null
        created_at: string
    }): OrgMember {
        return new OrgMember({
            id: row.id,
            organizationId: row.organization_id,
            name: row.name,
            email: row.email,
            role: row.role as UserRole,
            avatarUrl: row.avatar_url ?? null,
            createdAt: row.created_at,
        })
    }

    get id()             { return this.props.id }
    get organizationId() { return this.props.organizationId }
    get name()           { return this.props.name }
    get email()          { return this.props.email }
    get role()           { return this.props.role }
    get avatarUrl()      { return this.props.avatarUrl }
    get createdAt()      { return this.props.createdAt }

    isOwner():  boolean { return this.props.role === 'owner' }
    isAdmin():  boolean { return this.props.role === 'admin' }
    isAgent():  boolean { return this.props.role === 'agent' }
    isViewer(): boolean { return this.props.role === 'viewer' }

    roleLabel(): string {
        return roleLabel(this.props.role)
    }

    /** Iniciais para exibição de avatar */
    initials(): string {
        return this.props.name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(n => n[0].toUpperCase())
            .join('')
    }

    /** Verifica se este membro pode atualizar o role de outro membro */
    canUpdateRole(target: OrgMember): boolean {
        if (this.isOwner()) return !target.isOwner() // owner pode tudo exceto mover outro owner
        if (this.isAdmin()) return !target.isOwner() && !target.isAdmin() // admin pode mudar apenas agent/viewer
        return false
    }

    /** Verifica se este membro pode remover outro membro */
    canRemove(target: OrgMember): boolean {
        if (this.props.id === target.props.id) return false // não pode se auto-remover
        if (this.isOwner()) return !target.isOwner()
        if (this.isAdmin()) return !target.isOwner() && !target.isAdmin()
        return false
    }
}

import { listAllUsers } from '@/actions/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { Users, Shield, Crown, User as UserIcon, Eye } from 'lucide-react'
import Link from 'next/link'
import { AdminUserActions } from './AdminUserActions'

const roleColors: Record<string, string> = {
    owner: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    admin: 'bg-primary/10 text-primary border-primary/30',
    agent: 'bg-secondary text-muted-foreground border-border',
    viewer: 'bg-secondary text-muted-foreground/60 border-border',
}

const roleLabel: Record<string, string> = {
    owner: 'Proprietário',
    admin: 'Administrador',
    agent: 'Agente',
    viewer: 'Visualizador',
}

const RoleIcon: Record<string, React.ReactNode> = {
    owner: <Crown className="w-3 h-3" />,
    admin: <Shield className="w-3 h-3" />,
    agent: <UserIcon className="w-3 h-3" />,
    viewer: <Eye className="w-3 h-3" />,
}

export default async function AdminUsersPage() {
    const users = await listAllUsers()

    const ownerCount  = users.filter(u => u.role === 'owner').length
    const adminCount  = users.filter(u => u.role === 'admin').length
    const agentCount  = users.filter(u => u.role === 'agent').length
    const viewerCount = users.filter(u => u.role === 'viewer').length

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                category="Super Admin"
                title="Usuários"
                icon={Users}
                actions={
                    <span className="text-muted-foreground text-xs font-mono-data">{users.length} usuários</span>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Proprietários', value: ownerCount,  color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                    { label: 'Administradores', value: adminCount, color: 'text-primary',   bg: 'bg-primary/10 border-primary/20' },
                    { label: 'Agentes',         value: agentCount, color: 'text-foreground', bg: 'bg-card border-border' },
                    { label: 'Visualizadores',  value: viewerCount,color: 'text-muted-foreground', bg: 'bg-card border-border' },
                ].map(kpi => (
                    <div key={kpi.label} className={`rounded-(--radius) border p-4 ${kpi.bg}`}>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">{kpi.label}</p>
                        <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-card border border-border rounded-(--radius)">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Usuário</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Organização</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Papel</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Criado em</th>
                                <th className="text-right px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground/50 text-sm">
                                        Nenhum usuário encontrado
                                    </td>
                                </tr>
                            )}
                            {users.map(user => (
                                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-secondary/70 transition-colors">
                                    <td className="px-5 py-3">
                                        <p className="text-foreground font-medium text-sm">{user.name}</p>
                                        <p className="text-muted-foreground text-xs font-mono-data">{user.email}</p>
                                    </td>
                                    <td className="px-5 py-3">
                                        <Link href={`/admin/organizations/${user.org_id}`} className="text-foreground-secondary text-xs hover:text-primary transition-colors">
                                            {user.org_name}
                                        </Link>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold border rounded-(--radius) ${roleColors[user.role] ?? roleColors.agent}`}>
                                            {RoleIcon[user.role]}
                                            {roleLabel[user.role] ?? user.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-muted-foreground text-xs font-mono-data">
                                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <AdminUserActions
                                            userId={user.id}
                                            orgId={user.org_id}
                                            currentRole={user.role}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

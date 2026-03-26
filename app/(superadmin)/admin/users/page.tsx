import { listAllUsers } from '@/actions/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { Users } from 'lucide-react'
import Link from 'next/link'

const roleColors: Record<string, string> = {
    owner: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    admin: 'bg-primary/10 text-primary border-primary/30',
    agent: 'bg-secondary text-muted-foreground border-border',
    viewer: 'bg-secondary text-muted-foreground/60 border-border',
}

export default async function AdminUsersPage() {
    const users = await listAllUsers()

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

            <div className="bg-card border border-border rounded-(--radius)">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Usuário</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Organização</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Papel</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Criado em</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-12 text-center text-muted-foreground/50 text-sm">
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
                                        <span className={`px-2 py-0.5 text-xs font-semibold border rounded-(--radius) ${roleColors[user.role] ?? roleColors.agent}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-muted-foreground text-xs font-mono-data">
                                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
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

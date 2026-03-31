import { getOrganizationDetail } from '@/actions/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { Building2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const roleColors: Record<string, string> = {
    owner: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    admin: 'bg-primary/10 text-primary border-primary/30',
    agent: 'bg-secondary text-muted-foreground border-border',
    viewer: 'bg-secondary text-muted-foreground/60 border-border',
}

const statusColors: Record<string, string> = {
    draft: 'bg-secondary text-muted-foreground border-border',
    published: 'bg-green-500/10 text-green-400 border-green-500/30',
    archived: 'bg-secondary text-muted-foreground/50 border-border',
}

export default async function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { org, users, pages } = await getOrganizationDetail(id)

    if (!org) notFound()

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                category="Super Admin / Organizações"
                title={org.name}
                icon={Building2}
                actions={
                    <Link href="/admin/organizations" className="flex items-center gap-1.5 text-muted-foreground text-xs hover:text-foreground transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Voltar
                    </Link>
                }
            />

            {/* Org info */}
            <div className="bg-card border border-border rounded-(--radius) p-5 space-y-3 max-w-md">
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Informações</p>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">ID</span>
                        <span className="text-foreground font-mono-data text-xs">{org.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Criada em</span>
                        <span className="text-foreground text-xs">{new Date(org.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
            </div>

            {/* Users */}
            <div className="bg-card border border-border rounded-(--radius)">
                <div className="px-5 py-3 border-b border-border">
                    <p className="text-foreground text-sm font-semibold">
                        Usuários <span className="text-muted-foreground font-normal text-xs ml-1">({users.length})</span>
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Nome</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Email</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Papel</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Desde</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground/50 text-sm">Nenhum usuário</td>
                                </tr>
                            )}
                            {users.map(user => (
                                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-secondary/70 transition-colors">
                                    <td className="px-5 py-3 text-foreground font-medium text-sm">{user.name}</td>
                                    <td className="px-5 py-3 text-muted-foreground text-xs font-mono-data">{user.email}</td>
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

            {/* Landing Pages */}
            <div className="bg-card border border-border rounded-(--radius)">
                <div className="px-5 py-3 border-b border-border">
                    <p className="text-foreground text-sm font-semibold">
                        Landing Pages <span className="text-muted-foreground font-normal text-xs ml-1">({pages.length})</span>
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Nome</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Slug</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Status</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Criada em</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pages.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground/50 text-sm">Nenhuma landing page</td>
                                </tr>
                            )}
                            {pages.map(page => (
                                <tr key={page.id} className="border-b border-border last:border-0 hover:bg-secondary/70 transition-colors">
                                    <td className="px-5 py-3 text-foreground font-medium text-sm">{page.name}</td>
                                    <td className="px-5 py-3 text-muted-foreground text-xs font-mono-data">{page.slug}</td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 text-xs font-semibold border rounded-(--radius) ${statusColors[page.status] ?? statusColors.draft}`}>
                                            {page.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-muted-foreground text-xs font-mono-data">
                                        {new Date(page.created_at).toLocaleDateString('pt-BR')}
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

import { getAdminStats, listAllOrganizations } from '@/actions/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { ShieldCheck, Building2, Users, Globe } from 'lucide-react'
import Link from 'next/link'

export default async function AdminPage() {
    const [stats, orgs] = await Promise.all([getAdminStats(), listAllOrganizations()])

    const recentOrgs = orgs.slice(0, 8)

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                category="Super Admin"
                title="Platform Console"
                icon={ShieldCheck}
            />

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-(--radius) p-5 flex items-center gap-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                        <Building2 className="w-5 h-5 text-primary" />
                    </span>
                    <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Organizações</p>
                        <p className="text-foreground text-2xl font-black">{stats.total_orgs}</p>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-(--radius) p-5 flex items-center gap-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                        <Users className="w-5 h-5 text-primary" />
                    </span>
                    <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Usuários</p>
                        <p className="text-foreground text-2xl font-black">{stats.total_users}</p>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-(--radius) p-5 flex items-center gap-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                        <Globe className="w-5 h-5 text-primary" />
                    </span>
                    <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Landing Pages</p>
                        <p className="text-foreground text-2xl font-black">{stats.total_landing_pages}</p>
                    </div>
                </div>
            </div>

            {/* Recent orgs */}
            <div className="bg-card border border-border rounded-(--radius)">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                    <p className="text-foreground text-sm font-semibold">Organizações recentes</p>
                    <Link href="/admin/organizations" className="text-primary text-xs hover:underline">Ver todas</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Organização</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Usuários</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Landing Pages</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Criada em</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrgs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-12 text-center text-muted-foreground/50 text-sm">
                                        Nenhuma organização ainda
                                    </td>
                                </tr>
                            )}
                            {recentOrgs.map(org => (
                                <tr key={org.id} className="border-b border-border last:border-0 hover:bg-secondary/70 transition-colors">
                                    <td className="px-5 py-3">
                                        <Link href={`/admin/organizations/${org.id}`} className="text-foreground font-medium hover:text-primary transition-colors text-sm">
                                            {org.name}
                                        </Link>
                                    </td>
                                    <td className="px-5 py-3 text-muted-foreground text-xs font-mono-data">{org.user_count}</td>
                                    <td className="px-5 py-3 text-muted-foreground text-xs font-mono-data">{org.landing_page_count}</td>
                                    <td className="px-5 py-3 text-muted-foreground text-xs font-mono-data">
                                        {new Date(org.created_at).toLocaleDateString('pt-BR')}
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

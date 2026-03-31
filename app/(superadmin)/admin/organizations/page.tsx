import { listAllOrganizations } from '@/actions/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { Building2 } from 'lucide-react'
import Link from 'next/link'

export default async function AdminOrganizationsPage() {
    const orgs = await listAllOrganizations()

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                category="Super Admin"
                title="Organizações"
                icon={Building2}
                actions={
                    <span className="text-muted-foreground text-xs font-mono-data">{orgs.length} organizações</span>
                }
            />

            <div className="bg-card border border-border rounded-(--radius)">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Organização</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Usuários</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Landing Pages</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Criada em</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orgs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground/50 text-sm">
                                        Nenhuma organização cadastrada
                                    </td>
                                </tr>
                            )}
                            {orgs.map(org => (
                                <tr key={org.id} className="border-b border-border last:border-0 hover:bg-secondary/70 transition-colors">
                                    <td className="px-5 py-3">
                                        <Link href={`/admin/organizations/${org.id}`} className="text-foreground font-medium hover:text-primary transition-colors text-sm">
                                            {org.name}
                                        </Link>
                                        <p className="text-muted-foreground/50 text-[10px] font-mono-data">{org.id}</p>
                                    </td>

                                    <td className="px-5 py-3 text-muted-foreground text-xs font-mono-data">{org.user_count}</td>
                                    <td className="px-5 py-3 text-muted-foreground text-xs font-mono-data">{org.landing_page_count}</td>
                                    <td className="px-5 py-3 text-muted-foreground text-xs font-mono-data">
                                        {new Date(org.created_at).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-5 py-3">
                                        <Link
                                            href={`/admin/organizations/${org.id}`}
                                            className="text-primary text-xs hover:underline"
                                        >
                                            Detalhes →
                                        </Link>
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

import { listAllLandingPages } from '@/actions/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { Globe } from 'lucide-react'
import Link from 'next/link'

const statusColors: Record<string, string> = {
    draft: 'bg-secondary text-muted-foreground border-border',
    published: 'bg-green-500/10 text-green-400 border-green-500/30',
    archived: 'bg-secondary text-muted-foreground/50 border-border',
}

export default async function AdminLandingPagesPage() {
    const pages = await listAllLandingPages()

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                category="Super Admin"
                title="Landing Pages"
                icon={Globe}
                actions={
                    <span className="text-muted-foreground text-xs font-mono-data">{pages.length} páginas</span>
                }
            />

            <div className="bg-card border border-border rounded-(--radius)">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Nome</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Slug</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Organização</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Status</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Criada em</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {pages.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground/50 text-sm">
                                        Nenhuma landing page encontrada
                                    </td>
                                </tr>
                            )}
                            {pages.map(page => (
                                <tr key={page.id} className="border-b border-border last:border-0 hover:bg-secondary/70 transition-colors">
                                    <td className="px-5 py-3">
                                        <p className="text-foreground font-medium text-sm">{page.name}</p>
                                    </td>
                                    <td className="px-5 py-3 text-muted-foreground text-xs font-mono-data">{page.slug}</td>
                                    <td className="px-5 py-3">
                                        <Link href={`/admin/organizations/${page.org_id}`} className="text-foreground-secondary text-xs hover:text-primary transition-colors">
                                            {page.org_name}
                                        </Link>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 text-xs font-semibold border rounded-(--radius) ${statusColors[page.status] ?? statusColors.draft}`}>
                                            {page.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-muted-foreground text-xs font-mono-data">
                                        {new Date(page.created_at).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-5 py-3">
                                        {page.status === 'published' && (
                                            <a
                                                href={`/p/${page.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary text-xs hover:underline"
                                            >
                                                Ver →
                                            </a>
                                        )}
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

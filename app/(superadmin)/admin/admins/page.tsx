import { listSuperAdmins } from '@/actions/admin'
import { getAuthContext } from '@/infrastructure/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { UserCog, ShieldCheck } from 'lucide-react'
import { PromoteSuperAdminForm } from '@/components/crm/PromoteSuperAdminForm'
import { RevokeSuperAdminButton } from '@/components/crm/RevokeSuperAdminButton'

export default async function AdminsPage() {
    const [admins, ctx] = await Promise.all([listSuperAdmins(), getAuthContext()])

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                category="Super Admin"
                title="Administradores"
                icon={UserCog}
            />

            {/* Promote form */}
            <div className="bg-card border border-border rounded-(--radius) p-6">
                <div className="flex items-start gap-3 mb-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-foreground font-bold tracking-tight">Promover Super Admin</h2>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            Concede privilégios de super admin a um usuário existente da plataforma.
                        </p>
                    </div>
                </div>
                <PromoteSuperAdminForm />
            </div>

            {/* Current super admins */}
            <div className="bg-card border border-border rounded-(--radius)">
                <div className="px-5 py-3 border-b border-border">
                    <p className="text-foreground text-sm font-semibold">
                        Super Admins Ativos{' '}
                        <span className="text-muted-foreground font-normal text-xs ml-1">({admins.length})</span>
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Nome</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">E-mail</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Desde</th>
                                <th className="text-right px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-12 text-center text-muted-foreground/50 text-sm">
                                        Nenhum super admin encontrado.
                                    </td>
                                </tr>
                            )}
                            {admins.map((admin) => (
                                <tr key={admin.id} className="border-b border-border last:border-0 hover:bg-secondary/70 transition-colors">
                                    <td className="px-5 py-3 text-foreground font-medium text-sm">{admin.name}</td>
                                    <td className="px-5 py-3 text-muted-foreground text-xs font-mono">{admin.email}</td>
                                    <td className="px-5 py-3 text-muted-foreground text-xs">
                                        {new Date(admin.createdAt).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <RevokeSuperAdminButton
                                            userId={admin.id}
                                            isSelf={admin.id === ctx.userId}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info box */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-(--radius) p-4">
                <p className="text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">Como funciona</p>
                <p className="text-muted-foreground text-sm">
                    O status de super admin é armazenado no <code className="bg-muted px-1 py-0.5 rounded text-xs">app_metadata</code> do Supabase Auth e só pode ser
                    alterado via service role. Para ser aplicado, o usuário precisa fazer logout e login novamente para que o JWT seja renovado.
                </p>
            </div>
        </div>
    )
}

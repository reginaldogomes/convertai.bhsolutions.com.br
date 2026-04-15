import { listAllSubscriptions, listAllPlansAdmin } from '@/actions/saas'
import { PageHeader } from '@/components/layout/PageHeader'
import { CreditCard, Zap, Plus, Pencil, CheckCircle2, XCircle, Users } from 'lucide-react'
import { GrantCreditsButton } from '@/components/crm/GrantCreditsButton'
import { ChangePlanForm } from './ChangePlanForm'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function AdminPlansPage() {
    const [{ subscriptions }, { plans: planEntities }] = await Promise.all([
        listAllSubscriptions(),
        listAllPlansAdmin(),
    ])

    const activePlans = planEntities.filter(p => p.isActive)
    const totalActiveSubscriptions = subscriptions.filter(s => s.status === 'active' || s.status === 'trialing').length
    const totalCreditsGranted = subscriptions.reduce((acc, s) => acc + s.creditsBalance, 0)

    const planOptions = activePlans.map((p) => ({ id: p.id, name: p.name, priceBrl: p.priceBrl }))

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-start justify-between gap-4">
                <PageHeader
                    category="Super Admin"
                    title="Planos e Créditos"
                    icon={CreditCard}
                />
                <Link href="/admin/plans/edit">
                    <Button className="h-9 px-5 text-xs font-bold uppercase tracking-wider gap-2 shrink-0">
                        <Plus className="w-4 h-4" />
                        Novo Plano
                    </Button>
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-(--radius) p-5 flex items-center gap-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                        <CreditCard className="w-5 h-5 text-primary" />
                    </span>
                    <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Planos Ativos</p>
                        <p className="text-foreground text-2xl font-black">{activePlans.length}</p>
                        <p className="text-muted-foreground text-xs">{planEntities.length - activePlans.length} inativos</p>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-(--radius) p-5 flex items-center gap-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                        <Users className="w-5 h-5 text-primary" />
                    </span>
                    <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Assinaturas Ativas</p>
                        <p className="text-foreground text-2xl font-black">{totalActiveSubscriptions}</p>
                        <p className="text-muted-foreground text-xs">{subscriptions.length} total</p>
                    </div>
                </div>
                {activePlans.slice(0, 2).map((plan) => {
                    const count = subscriptions.filter(s => s.planId === plan.id && (s.status === 'active' || s.status === 'trialing')).length
                    return (
                        <div key={plan.id} className="bg-card border border-border rounded-(--radius) p-5 flex items-center gap-4">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                                <Zap className="w-5 h-5 text-primary" />
                            </span>
                            <div>
                                <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">{plan.name}</p>
                                <p className="text-foreground text-2xl font-black">{count}</p>
                                <p className="text-muted-foreground text-xs">
                                    {plan.formattedPrice()}/mês · {plan.monthlyCredits.toLocaleString('pt-BR')} créditos
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Gestão de Planos */}
            <div className="bg-card border border-border rounded-(--radius)">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <div>
                        <p className="text-foreground text-sm font-semibold">Gestão de Planos</p>
                        <p className="text-muted-foreground text-xs mt-0.5">Crie e edite os planos disponíveis na plataforma.</p>
                    </div>
                    <Link href="/admin/plans/edit">
                        <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-bold uppercase tracking-wider gap-1.5">
                            <Plus className="w-3.5 h-3.5" /> Novo Plano
                        </Button>
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Plano</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Preço</th>
                                <th className="text-right px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Créditos/mês</th>
                                <th className="text-right px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Contatos</th>
                                <th className="text-right px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Assinantes</th>
                                <th className="text-center px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Status</th>
                                <th className="text-right px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {planEntities.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                                        Nenhum plano cadastrado.
                                    </td>
                                </tr>
                            ) : (
                                planEntities.map((plan) => {
                                    const subscribers = subscriptions.filter(s => s.planId === plan.id && (s.status === 'active' || s.status === 'trialing')).length
                                    return (
                                        <tr key={plan.id} className="border-b border-border/60 hover:bg-muted/20">
                                            <td className="px-5 py-3">
                                                <p className="text-foreground font-semibold">{plan.name}</p>
                                                {plan.description && (
                                                    <p className="text-muted-foreground text-xs mt-0.5">{plan.description}</p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-foreground font-medium">
                                                {plan.formattedPrice()}<span className="text-muted-foreground font-normal">/mês</span>
                                            </td>
                                            <td className="px-5 py-3 text-right font-bold text-foreground">
                                                {plan.monthlyCredits.toLocaleString('pt-BR')}
                                            </td>
                                            <td className="px-5 py-3 text-right text-foreground-secondary">
                                                {plan.maxContacts === -1 ? '∞' : plan.maxContacts.toLocaleString('pt-BR')}
                                            </td>
                                            <td className="px-5 py-3 text-right text-foreground-secondary font-medium">
                                                {subscribers}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                {plan.isActive ? (
                                                    <span className="inline-flex items-center gap-1 text-[hsl(var(--success))] text-xs font-bold uppercase">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-muted-foreground text-xs font-bold uppercase">
                                                        <XCircle className="w-3.5 h-3.5" /> Inativo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <Link href={`/admin/plans/edit?id=${plan.id}`}>
                                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1.5">
                                                        <Pencil className="w-3.5 h-3.5" /> Editar
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assinaturas */}
            <div className="bg-card border border-border rounded-(--radius)">
                <div className="px-5 py-4 border-b border-border">
                    <p className="text-foreground text-sm font-semibold">Assinaturas ({subscriptions.length})</p>
                    <p className="text-muted-foreground text-xs mt-0.5">Saldo total em créditos: {totalCreditsGranted.toLocaleString('pt-BR')}</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Organização</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Plano</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Status</th>
                                <th className="text-right px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Créditos</th>
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Renova em</th>
                                <th className="text-right px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscriptions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                                        Nenhuma assinatura encontrada.
                                    </td>
                                </tr>
                            ) : (
                                subscriptions.map((sub) => (
                                    <tr key={sub.orgId} className="border-b border-border/60 hover:bg-muted/20">
                                        <td className="px-5 py-3 text-foreground font-medium">{sub.orgName}</td>
                                        <td className="px-5 py-3 text-foreground-secondary">{sub.planName}</td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold uppercase ${
                                                sub.status === 'active' || sub.status === 'trialing'
                                                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
                                                    : sub.status === 'past_due'
                                                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                                                        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                                            }`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right font-bold text-foreground">
                                            {sub.creditsBalance.toLocaleString('pt-BR')}
                                        </td>
                                        <td className="px-5 py-3 text-foreground-secondary">
                                            {new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <ChangePlanForm orgId={sub.orgId} currentPlanId={sub.planId} plans={planOptions} />
                                                <GrantCreditsButton orgId={sub.orgId} orgName={sub.orgName} />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

import { listAllSubscriptions } from '@/actions/saas'
import { getPlans } from '@/actions/saas'
import { PageHeader } from '@/components/layout/PageHeader'
import { CreditCard, Zap } from 'lucide-react'
import { GrantCreditsButton } from '@/components/crm/GrantCreditsButton'
import { ChangePlanForm } from './ChangePlanForm'

export default async function AdminPlansPage() {
    const [{ subscriptions }, { plans }] = await Promise.all([
        listAllSubscriptions(),
        getPlans(),
    ])

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                category="Super Admin"
                title="Planos e Créditos"
                icon={CreditCard}
            />

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {plans.map((plan) => {
                    const count = subscriptions.filter(s => s.planId === plan.id && s.status === 'active').length
                    return (
                        <div key={plan.id} className="bg-card border border-border rounded-(--radius) p-5 flex items-center gap-4">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                                <Zap className="w-5 h-5 text-primary" />
                            </span>
                            <div>
                                <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">{plan.name}</p>
                                <p className="text-foreground text-2xl font-black">{count}</p>
                                <p className="text-muted-foreground text-xs">{plan.formattedPrice()}/mês</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* All subscriptions */}
            <div className="bg-card border border-border rounded-(--radius)">
                <div className="px-5 py-3 border-b border-border">
                    <p className="text-foreground text-sm font-semibold">Assinaturas ({subscriptions.length})</p>
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
                                                <ChangePlanForm orgId={sub.orgId} currentPlanId={sub.planId} plans={plans} />
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

import { adminGetAllPlans } from '@/actions/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { CreditCard } from 'lucide-react'
import { EditPlanCard } from './EditPlanCard'
import { formatLimit } from '@/domain/entities/plan'

const PLAN_COLORS: Record<string, string> = {
    free: 'text-muted-foreground',
    starter: 'text-blue-400',
    pro: 'text-primary',
    enterprise: 'text-amber-400',
}

export default async function PlansPage() {
    const plans = await adminGetAllPlans()

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                category="Super Admin"
                title="Planos e Limites"
                icon={CreditCard}
            />

            {/* Summary table */}
            <div className="bg-card border border-border rounded-(--radius) overflow-hidden">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left px-4 py-2.5 text-muted-foreground font-medium uppercase tracking-wider">Plano</th>
                            <th className="text-center px-3 py-2.5 text-muted-foreground font-medium uppercase tracking-wider">Landing Pages</th>
                            <th className="text-center px-3 py-2.5 text-muted-foreground font-medium uppercase tracking-wider">Contatos</th>
                            <th className="text-center px-3 py-2.5 text-muted-foreground font-medium uppercase tracking-wider">Emails/mês</th>
                            <th className="text-center px-3 py-2.5 text-muted-foreground font-medium uppercase tracking-wider">WhatsApp/mês</th>
                            <th className="text-center px-3 py-2.5 text-muted-foreground font-medium uppercase tracking-wider">Automações</th>
                            <th className="text-center px-3 py-2.5 text-muted-foreground font-medium uppercase tracking-wider">KB Docs</th>
                            <th className="text-right px-4 py-2.5 text-muted-foreground font-medium uppercase tracking-wider">Preço</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plans.map(plan => (
                            <tr key={plan.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                                <td className={`px-4 py-3 font-bold uppercase tracking-wider ${PLAN_COLORS[plan.id] ?? ''}`}>
                                    {plan.name}
                                </td>
                                <td className="px-3 py-3 text-center font-mono-data text-foreground">{formatLimit(plan.limits.landingPagesLimit)}</td>
                                <td className="px-3 py-3 text-center font-mono-data text-foreground">{formatLimit(plan.limits.contactsLimit)}</td>
                                <td className="px-3 py-3 text-center font-mono-data text-foreground">{formatLimit(plan.limits.emailsMonthlyLimit)}</td>
                                <td className="px-3 py-3 text-center font-mono-data text-foreground">{formatLimit(plan.limits.whatsappMonthlyLimit)}</td>
                                <td className="px-3 py-3 text-center font-mono-data text-foreground">{formatLimit(plan.limits.automationsLimit)}</td>
                                <td className="px-3 py-3 text-center font-mono-data text-foreground">{formatLimit(plan.limits.knowledgeBaseLimit)}</td>
                                <td className="px-4 py-3 text-right font-mono-data text-foreground">
                                    {plan.priceBrl === 0
                                        ? 'Grátis'
                                        : `R$ ${plan.priceBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit cards */}
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Editar Planos</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map(plan => (
                    <EditPlanCard key={plan.id} plan={plan} />
                ))}
            </div>
        </div>
    )
}

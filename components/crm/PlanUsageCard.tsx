import type { OrgLimitsAndUsage } from '@/domain/interfaces/plan-repository'
import { getLimitPercentage, formatLimit, isUnlimited } from '@/domain/entities/plan'
import { BarChart3, Users, Globe, Mail, MessageCircle, Zap, BookOpen } from 'lucide-react'

interface MeterProps {
    label: string
    current: number
    limit: number
    icon: React.ReactNode
}

function UsageMeter({ label, current, limit, icon }: MeterProps) {
    const pct = getLimitPercentage(limit, current)
    const unlimited = isUnlimited(limit)
    const warn = pct >= 80 && !unlimited
    const full = pct >= 100 && !unlimited

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                    {icon}
                    {label}
                </span>
                <span className={`font-mono-data font-semibold ${full ? 'text-destructive' : warn ? 'text-amber-400' : 'text-foreground'}`}>
                    {current.toLocaleString('pt-BR')}
                    {!unlimited && ` / ${formatLimit(limit)}`}
                    {unlimited && <span className="text-muted-foreground/60 font-normal ml-1">ilimitado</span>}
                </span>
            </div>
            {!unlimited && (
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${
                            full
                                ? 'bg-destructive'
                                : warn
                                ? 'bg-amber-400'
                                : 'bg-primary'
                        }`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            )}
        </div>
    )
}

interface PlanBadgeProps {
    plan: string
}

const PLAN_BADGE: Record<string, string> = {
    free: 'bg-secondary text-muted-foreground border-border',
    starter: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    pro: 'bg-primary/10 text-primary border-primary/30',
    enterprise: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
}

function PlanBadge({ plan }: PlanBadgeProps) {
    return (
        <span
            className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border rounded-(--radius) ${PLAN_BADGE[plan] ?? PLAN_BADGE.free}`}
        >
            {plan}
        </span>
    )
}

interface Props {
    data: OrgLimitsAndUsage
}

export function PlanUsageCard({ data }: Props) {
    const { plan, limits, usage } = data

    const meters: MeterProps[] = [
        { label: 'Landing Pages', current: usage.landingPages, limit: limits.landingPagesLimit, icon: <Globe className="w-3.5 h-3.5" /> },
        { label: 'Contatos', current: usage.contacts, limit: limits.contactsLimit, icon: <Users className="w-3.5 h-3.5" /> },
        { label: 'Emails este mês', current: usage.emailsThisMonth, limit: limits.emailsMonthlyLimit, icon: <Mail className="w-3.5 h-3.5" /> },
        { label: 'WhatsApp este mês', current: usage.whatsappThisMonth, limit: limits.whatsappMonthlyLimit, icon: <MessageCircle className="w-3.5 h-3.5" /> },
        { label: 'Automações ativas', current: usage.automations, limit: limits.automationsLimit, icon: <Zap className="w-3.5 h-3.5" /> },
        { label: 'Base de Conhecimento', current: usage.knowledgeBase, limit: limits.knowledgeBaseLimit, icon: <BookOpen className="w-3.5 h-3.5" /> },
    ]

    return (
        <div className="bg-card border border-border rounded-(--radius) p-5 space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground font-bold text-sm">Uso do Plano</span>
                </div>
                <PlanBadge plan={plan} />
            </div>

            <div className="space-y-3">
                {meters.map(m => (
                    <UsageMeter key={m.label} {...m} />
                ))}
            </div>

            {data.hasOverride && (
                <p className="text-muted-foreground/60 text-[10px] uppercase tracking-wider">
                    * Limites personalizados ativados para esta conta
                </p>
            )}
        </div>
    )
}

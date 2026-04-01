import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { Users, MessageSquare, Mail, TrendingUp, type LucideIcon } from 'lucide-react'

const emptyStats = { newLeads: 0, openConversations: 0, campaignsSent: 0, conversionRate: 0 }

type StatsKey = keyof typeof emptyStats

interface KpiCard {
    key: StatsKey
    label: string
    icon: LucideIcon
    color: string
    suffix?: string
}

const kpiCards: KpiCard[] = [
    { key: 'newLeads', label: 'Novos Leads (7d)', icon: Users, color: 'text-primary' },
    { key: 'openConversations', label: 'Conversas Abertas', icon: MessageSquare, color: 'text-blue-400' },
    { key: 'campaignsSent', label: 'Campanhas Enviadas', icon: Mail, color: 'text-green-400' },
    { key: 'conversionRate', label: 'Taxa de Conversão', icon: TrendingUp, color: 'text-yellow-400', suffix: '%' },
]

export default async function DashboardPage() {
    const auth = await tryGetAuthContext()
    const stats = auth
        ? await useCases.getDashboardStats().execute(auth.orgId)
        : emptyStats

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-6">
                <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] font-medium mb-1">Visão Geral</p>
                    <h1 className="text-foreground text-2xl font-black tracking-tight">Dashboard</h1>
                </div>
                <div className="text-muted-foreground/60 text-xs font-mono-data">
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {kpiCards.map(({ key, label, icon: Icon, color, suffix }) => (
                    <div key={key} className="bg-card border border-border p-5 space-y-3 hover:border-primary transition-colors rounded-(--radius)">
                        <div className="flex items-center justify-between">
                            <p className="text-muted-foreground text-xs uppercase tracking-wider">{label}</p>
                            <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                        <p className={`text-3xl font-black font-mono-data tracking-tight ${color}`}>
                            {stats[key]}{suffix}
                        </p>
                    </div>
                ))}
            </div>

            {/* Section: Recent Activity placeholder */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-card border border-border p-6 rounded-(--radius)">
                    <h2 className="text-foreground font-bold text-sm mb-4 uppercase tracking-wider">Atividade Recente</h2>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-3 py-2 border-b border-border-subtle last:border-0">
                                <div className="w-1.5 h-1.5 bg-primary shrink-0 rounded-full" />
                                <div className="h-3 bg-muted flex-1 rounded" />
                                <div className="h-3 bg-muted w-16 rounded" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-card border border-border p-6 rounded-(--radius)">
                    <h2 className="text-foreground font-bold text-sm mb-4 uppercase tracking-wider">Pipeline por Estágio</h2>
                    <div className="space-y-2">
                        {['Novo Lead', 'Contato', 'Proposta', 'Negociação', 'Fechado'].map((stage, i) => (
                            <div key={stage} className="flex items-center gap-3">
                                <p className="text-muted-foreground text-xs w-24 shrink-0">{stage}</p>
                                <div className="flex-1 h-1.5 bg-muted rounded-full">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(5, 80 - i * 15)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

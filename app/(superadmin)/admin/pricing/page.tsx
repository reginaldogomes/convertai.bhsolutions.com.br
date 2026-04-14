import { getPlatformCostAnalysis } from '@/actions/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { TrendingUp, Zap, DollarSign, BarChart2, AlertTriangle, CheckCircle2, Package } from 'lucide-react'

function fmt(brl: number) {
    return brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 4, maximumFractionDigits: 4 })
}

function fmtBig(brl: number) {
    return brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtCents(cents: number) {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

function MarginBadge({ percent }: { percent: number }) {
    const color =
        percent >= 80  ? 'bg-green-500/10 text-green-500 border-green-500/30' :
        percent >= 50  ? 'bg-sky-500/10 text-sky-500 border-sky-500/30' :
        percent >= 25  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                         'bg-red-500/10 text-red-500 border-red-500/30'
    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${color}`}>
            {percent.toFixed(1)}%
        </span>
    )
}

export default async function AdminPricingPage() {
    const analysis = await getPlatformCostAnalysis()

    const totalAiCostBrl = analysis.totalAiCostCents / 100
    // receita teórica do mês: total de créditos * valor médio do crédito (Starter)
    const starterPlan = analysis.plans.find(p => p.id === 'starter')
    const avgCreditValue = starterPlan?.costPerCreditBrl ?? 0.197
    const revenueFromCredits = analysis.totalCreditConsumed * avgCreditValue
    const grossMarginPct = revenueFromCredits > 0
        ? ((revenueFromCredits - totalAiCostBrl) / revenueFromCredits) * 100
        : 0

    return (
        <div className="p-8 space-y-8">
            <PageHeader
                category="Super Admin"
                title="Precificação & Análise de Custos"
                icon={TrendingUp}
            />

            {/* Info: markup target */}
            <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-(--radius)">
                <TrendingUp className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                    <p className="text-foreground text-sm font-semibold">Política de Markup da Plataforma</p>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Markup mínimo alvo: <strong className="text-foreground">{analysis.markupPercent}% sobre custos reais de API</strong>.
                        Os valores abaixo mostram a margem real praticada por operação com base nos preços atuais dos planos.
                    </p>
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-(--radius) p-5">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" /> Custo Real IA (mês)
                    </p>
                    <p className="text-foreground text-2xl font-black mt-1">{fmtBig(totalAiCostBrl)}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">estimativa via ai_usage_log</p>
                </div>
                <div className="bg-card border border-border rounded-(--radius) p-5">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" /> Créditos Consumidos (mês)
                    </p>
                    <p className="text-foreground text-2xl font-black mt-1">{analysis.totalCreditConsumed.toLocaleString('pt-BR')}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">todas as organizações</p>
                </div>
                <div className="bg-card border border-border rounded-(--radius) p-5">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" /> Receita de Créditos (mês)
                    </p>
                    <p className="text-foreground text-2xl font-black mt-1">{fmtBig(revenueFromCredits)}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">valor Starter × créditos consumidos</p>
                </div>
                <div className="bg-card border border-border rounded-(--radius) p-5">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                        <BarChart2 className="w-3.5 h-3.5" /> Margem Bruta (mês)
                    </p>
                    <p className="text-foreground text-2xl font-black mt-1">{grossMarginPct.toFixed(1)}%</p>
                    <p className="text-muted-foreground text-xs mt-0.5">(receita − custo IA) / receita</p>
                </div>
            </div>

            {/* Markup por operação */}
            <div className="bg-card border border-border rounded-(--radius)">
                <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-primary" />
                    <p className="text-foreground text-sm font-semibold">Margem por Tipo de Operação</p>
                    <span className="text-muted-foreground text-xs ml-auto">baseado no plano Starter (R${avgCreditValue.toFixed(4)}/crédito)</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Operação</th>
                                <th className="text-right px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Créditos Cobrados</th>
                                <th className="text-right px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Valor Cobrado (R$)</th>
                                <th className="text-right px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Custo Real API</th>
                                <th className="text-right px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Lucro/Op</th>
                                <th className="text-right px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Margem</th>
                                <th className="text-right px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Créditos em Mês</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analysis.costBreakdown.map((item) => {
                                const typeKey = item.operation.includes('IA') ? 'usage_ai'
                                    : item.operation.includes('WhatsApp') ? 'usage_whatsapp'
                                    : item.operation.includes('SMS') ? 'usage_sms'
                                    : 'usage_email'
                                const monthlyCreditsUsed = analysis.totalCreditConsumedByType[typeKey] ?? 0
                                return (
                                    <tr key={item.operation} className="border-b border-border/60 hover:bg-muted/20">
                                        <td className="px-5 py-3 text-foreground font-medium">{item.operation}</td>
                                        <td className="px-5 py-3 text-right font-mono text-foreground-secondary">{item.creditCharged} cr</td>
                                        <td className="px-5 py-3 text-right font-mono text-foreground">{fmt(item.creditValueBrl)}</td>
                                        <td className="px-5 py-3 text-right font-mono text-muted-foreground">{fmt(item.realCostBrl)}</td>
                                        <td className="px-5 py-3 text-right font-mono text-green-500 font-bold">
                                            {fmt(item.creditValueBrl - item.realCostBrl)}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <MarginBadge percent={item.marginPercent} />
                                        </td>
                                        <td className="px-5 py-3 text-right text-muted-foreground font-mono text-xs">
                                            {monthlyCreditsUsed.toLocaleString('pt-BR')}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Planos: margem por plano */}
            <div className="bg-card border border-border rounded-(--radius)">
                <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <p className="text-foreground text-sm font-semibold">Análise de Margem por Plano</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Plano</th>
                                <th className="text-right px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Preço/mês</th>
                                <th className="text-right px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Créditos/mês</th>
                                <th className="text-right px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">R$ por Crédito</th>
                                <th className="text-right px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Custo API/Crédito</th>
                                <th className="text-right px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Margem estimada</th>
                                <th className="text-right px-5 py-3 text-muted-foreground text-xs uppercase tracking-wider font-medium">Markup alvo 25%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analysis.plans.map((plan) => {
                                const minPriceFor25 = plan.estimatedApiCostPerCredit * plan.monthlyCredits * 1.25
                                const ok = plan.priceBrl >= minPriceFor25
                                return (
                                    <tr key={plan.id} className="border-b border-border/60 hover:bg-muted/20">
                                        <td className="px-5 py-3 text-foreground font-semibold">{plan.name}</td>
                                        <td className="px-5 py-3 text-right font-bold text-foreground">
                                            {fmtBig(plan.priceBrl)}
                                        </td>
                                        <td className="px-5 py-3 text-right font-mono text-foreground-secondary">
                                            {plan.monthlyCredits.toLocaleString('pt-BR')}
                                        </td>
                                        <td className="px-5 py-3 text-right font-mono text-foreground">
                                            {fmt(plan.costPerCreditBrl)}
                                        </td>
                                        <td className="px-5 py-3 text-right font-mono text-muted-foreground">
                                            {fmt(plan.estimatedApiCostPerCredit)}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <MarginBadge percent={plan.marginPercent} />
                                        </td>
                                        <td className="px-5 py-3 text-right text-xs">
                                            {ok ? (
                                                <span className="flex items-center justify-end gap-1 text-green-500 font-bold">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    {fmtBig(minPriceFor25)} mín.
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-end gap-1 text-amber-500 font-bold">
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                    {fmtBig(minPriceFor25)} mín.
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Custos reais de referência */}
            <div className="bg-card border border-border rounded-(--radius) p-6">
                <p className="text-foreground text-sm font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Tabela de Referência de Custos de API (base 2026)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                        { label: 'Gemini 2.5 Flash (avg/call)', cost: 0.30, note: '~2k chars input+output' },
                        { label: 'Gemini 2.5 Pro (avg/call)', cost: 1.50, note: '~2k chars input+output' },
                        { label: 'WhatsApp Twilio BR', cost: 19.00, note: 'business-initiated, por msg' },
                        { label: 'SMS Twilio BR', cost: 10.00, note: 'por mensagem' },
                        { label: 'E-mail Resend', cost: 0.10, note: 'por destinatário' },
                        { label: 'Supabase / infra', cost: 0.01, note: 'estimativa por request' },
                    ].map(item => (
                        <div key={item.label} className="p-3 bg-[hsl(var(--background-tertiary))] rounded-(--radius) border border-border">
                            <p className="text-foreground text-xs font-semibold">{item.label}</p>
                            <p className="text-primary font-bold text-base mt-0.5">{fmtCents(item.cost)}</p>
                            <p className="text-muted-foreground text-[10px] mt-0.5">{item.note}</p>
                        </div>
                    ))}
                </div>
                <p className="text-muted-foreground text-xs mt-4">
                    * Custos estimados com base no pricing público das APIs em abril 2026. Variam conforme volume e câmbio USD/BRL.
                    As margens reais podem ser maiores — os planos mensais cobrem mais do que apenas o custo variável de API.
                </p>
            </div>
        </div>
    )
}

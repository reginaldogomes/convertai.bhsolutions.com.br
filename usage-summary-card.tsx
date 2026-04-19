'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { DollarSign, Zap } from 'lucide-react'
import Link from 'next/link'

interface UsageSummary {
    monthlyBudget: number
    currentMonthUsage: number
    dailyQuota: number
    todayUsage: number
    currency: 'BRL' | 'USD'
}

interface UsageSummaryCardProps {
    usage: UsageSummary | null
}

function formatCurrency(value: number, currency: string) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency,
    }).format(value)
}

export function UsageSummaryCard({ usage }: UsageSummaryCardProps) {
    if (!usage) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-foreground-secondary">Uso de IA</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-sm text-muted-foreground py-4">
                        Dados de uso indisponíveis.
                    </div>
                </CardContent>
            </Card>
        )
    }

    const budgetPercentage = usage.monthlyBudget > 0 ? (usage.currentMonthUsage / usage.monthlyBudget) * 100 : 0
    const quotaPercentage = usage.dailyQuota > 0 ? (usage.todayUsage / usage.dailyQuota) * 100 : 0

    return (
        <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground-secondary">Uso de IA e Créditos</CardTitle>
                <Link href="/settings?tab=governance" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    Ver detalhes
                </Link>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-4">
                    <div title={`Usado ${formatCurrency(usage.currentMonthUsage, usage.currency)} de ${formatCurrency(usage.monthlyBudget, usage.currency)}`}>
                        <div className="flex justify-between items-baseline mb-1 text-xs text-muted-foreground">
                            <p className="flex items-center gap-1.5"><DollarSign className="w-3 h-3" /> Orçamento Mensal</p>
                            <p>{Math.round(budgetPercentage)}%</p>
                        </div>
                        <Progress value={budgetPercentage} className="h-2 [&>*]:bg-sky-500" />
                    </div>
                    <div title={`Usado ${usage.todayUsage.toLocaleString('pt-BR')} de ${usage.dailyQuota.toLocaleString('pt-BR')}`}>
                        <div className="flex justify-between items-baseline mb-1 text-xs text-muted-foreground">
                            <p className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> Limite Diário</p>
                            <p>{Math.round(quotaPercentage)}%</p>
                        </div>
                        <Progress value={quotaPercentage} className="h-2 [&>*]:bg-amber-500" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
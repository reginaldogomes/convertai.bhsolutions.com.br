'use client'

import { useMemo, useState } from 'react'
import { useActionState } from 'react'
import { Building, Puzzle, Mail, MessageSquare, MessageCircle, CheckCircle2, XCircle, Globe, Phone, MapPin, Sparkles, GaugeCircle, BookOpen, ArrowRight, CreditCard, Zap, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { purgeAiUsageHistory, updateAiGovernancePolicy, updateOrganization } from '@/actions/organization'
import { BuyCreditsButton } from '@/components/crm/BuyCreditsButton'
import type { Subscription, CreditPack, CreditTransaction } from '@/domain/entities'
import { InlineNotice } from '@/components/ui/inline-notice'
import Link from 'next/link'

interface Props {
    profileWithOrg: {
        orgId: string
        orgName: string
        orgEmail: string | null
        orgPhone: string | null
        orgWebsite: string | null
        orgAddress: string | null
        orgCity: string | null
        orgState: string | null
        orgZipCode: string | null
        orgCountry: string | null
        orgDescription: string | null
        name: string
        email: string
        role: string
    } | null
    integrations: {
        sendgrid: boolean
        twilioWhatsapp: boolean
        twilioSms: boolean
    }
    aiGovernance: {
        available: boolean
        dailyRequestsLimit: number
        monthlyBudgetCents: number
        hardBlockEnabled: boolean
        dailyRequestsUsed: number
        monthlyCostCents: number
        monthlySuccessCount: number
    } | null
    aiUsageEvents: Array<{
        id: string
        createdAt: string
        status: 'started' | 'success' | 'error' | 'blocked'
        featureKey: string
        model: string
        routeScope: string
        estimatedCostCents: number
        durationMs: number | null
        errorCode: string | null
    }>
    knowledgeEntryCount: number
    subscription: Subscription | null
    creditPacks: CreditPack[]
    creditTransactions: CreditTransaction[]
}

function StatusBadge({ active }: { active: boolean }) {
    return active ? (
        <span className="flex items-center gap-1 text-xs font-bold text-green-500">
            <CheckCircle2 className="w-3.5 h-3.5" /> Configurado
        </span>
    ) : (
        <span className="flex items-center gap-1 text-xs font-bold text-destructive">
            <XCircle className="w-3.5 h-3.5" /> Não configurado
        </span>
    )
}

function formatCurrencyFromCents(value: number): string {
    return (value / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    })
}

export function SettingsTabs({ profileWithOrg, integrations, aiGovernance, aiUsageEvents, knowledgeEntryCount, subscription, creditPacks, creditTransactions }: Props) {
    const [tab, setTab] = useState<'org' | 'integrations' | 'knowledge' | 'ai' | 'plan'>('org')
    const [orgState, orgAction, orgPending] = useActionState(updateOrganization, { error: '', success: false })
    const [aiState, aiAction, aiPending] = useActionState(updateAiGovernancePolicy, { error: '', success: false })
    const [purgeState, purgeAction, purgePending] = useActionState(purgeAiUsageHistory, {
        error: '',
        success: false,
        deletedCount: 0,
    })
    const [period, setPeriod] = useState<'24h' | '7d' | '30d' | '90d'>('30d')
    const [statusFilter, setStatusFilter] = useState<'all' | 'started' | 'success' | 'error' | 'blocked'>('all')
    const [featureFilter, setFeatureFilter] = useState<'all' | string>('all')
    const [modelQuery, setModelQuery] = useState('')

    const dailyUsagePercent = aiGovernance
        ? Math.min(100, Math.round((aiGovernance.dailyRequestsUsed / Math.max(1, aiGovernance.dailyRequestsLimit)) * 100))
        : 0

    const monthlyUsagePercent = aiGovernance
        ? Math.min(100, Math.round((aiGovernance.monthlyCostCents / Math.max(1, aiGovernance.monthlyBudgetCents)) * 100))
        : 0

    const featureOptions = useMemo(() => {
        return Array.from(new Set(aiUsageEvents.map((event) => event.featureKey))).sort((a, b) => a.localeCompare(b))
    }, [aiUsageEvents])

    const filteredEvents = useMemo(() => {
        const now = Date.now()
        const periodMs = period === '24h'
            ? 24 * 60 * 60 * 1000
            : period === '7d'
                ? 7 * 24 * 60 * 60 * 1000
                : period === '30d'
                    ? 30 * 24 * 60 * 60 * 1000
                    : 90 * 24 * 60 * 60 * 1000
        const threshold = now - periodMs

        return aiUsageEvents.filter((event) => {
            const createdAtMs = new Date(event.createdAt).getTime()
            const inPeriod = Number.isFinite(createdAtMs) && createdAtMs >= threshold
            const matchesStatus = statusFilter === 'all' || event.status === statusFilter
            const matchesFeature = featureFilter === 'all' || event.featureKey === featureFilter
            const normalizedModelQuery = modelQuery.trim().toLowerCase()
            const matchesModel =
                normalizedModelQuery.length === 0 ||
                event.model.toLowerCase().includes(normalizedModelQuery) ||
                event.routeScope.toLowerCase().includes(normalizedModelQuery)

            return inPeriod && matchesStatus && matchesFeature && matchesModel
        })
    }, [aiUsageEvents, featureFilter, modelQuery, period, statusFilter])

    const filteredCostCents = useMemo(() => {
        return filteredEvents.reduce((sum, event) => sum + event.estimatedCostCents, 0)
    }, [filteredEvents])

    const filteredSuccessCount = useMemo(() => {
        return filteredEvents.filter((event) => event.status === 'success').length
    }, [filteredEvents])

    const filteredBlockedCount = useMemo(() => {
        return filteredEvents.filter((event) => event.status === 'blocked').length
    }, [filteredEvents])

    const statusBadgeClassMap: Record<'started' | 'success' | 'error' | 'blocked', string> = {
        started: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
        success: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
        error: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
        blocked: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    }

    function formatDateTime(value: string): string {
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return value
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Nav Tabs */}
            <div className="space-y-1">
                <Button
                    type="button"
                    variant={tab === 'org' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setTab('org')}
                    className="w-full justify-start gap-3 px-4 py-2.5 text-left text-sm font-bold"
                >
                    <Building className={`w-4 h-4 ${tab === 'org' ? 'text-primary' : ''}`} /> Organização
                </Button>
                <Button
                    type="button"
                    variant={tab === 'integrations' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setTab('integrations')}
                    className="w-full justify-start gap-3 px-4 py-2.5 text-left text-sm font-bold"
                >
                    <Puzzle className={`w-4 h-4 ${tab === 'integrations' ? 'text-primary' : ''}`} /> Integrações
                </Button>
                <Button
                    type="button"
                    variant={tab === 'knowledge' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setTab('knowledge')}
                    className="w-full justify-start gap-3 px-4 py-2.5 text-left text-sm font-bold"
                >
                    <Sparkles className={`w-4 h-4 ${tab === 'knowledge' ? 'text-primary' : ''}`} /> Base de Conhecimento
                </Button>
                <Button
                    type="button"
                    variant={tab === 'ai' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setTab('ai')}
                    className="w-full justify-start gap-3 px-4 py-2.5 text-left text-sm font-bold"
                >
                    <Sparkles className={`w-4 h-4 ${tab === 'ai' ? 'text-primary' : ''}`} /> Governança IA
                </Button>
                <Button
                    type="button"
                    variant={tab === 'plan' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setTab('plan')}
                    className="w-full justify-start gap-3 px-4 py-2.5 text-left text-sm font-bold"
                >
                    <CreditCard className={`w-4 h-4 ${tab === 'plan' ? 'text-primary' : ''}`} /> Plano e Créditos
                </Button>
            </div>

            {/* Content */}
            <div className="md:col-span-3 space-y-8">
                {tab === 'org' && (
                    <>
                        <div className="bg-card border border-border p-6 rounded-(--radius)">
                            <h2 className="text-foreground font-bold tracking-tight mb-2">Perfil da Empresa</h2>
                            <p className="text-muted-foreground text-sm mb-6">Atualize os dados da sua organização.</p>

                            {orgState.success && (
                                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-(--radius)">
                                    <p className="text-green-700 dark:text-green-300 text-sm font-medium">Dados salvos com sucesso!</p>
                                </div>
                            )}
                            {orgState.error && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-(--radius)">
                                    <p className="text-red-700 dark:text-red-300 text-sm font-medium">{orgState.error}</p>
                                </div>
                            )}

                            <form action={orgAction} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Nome da Organização</Label>
                                        <Input name="name" defaultValue={profileWithOrg?.orgName} className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email da Empresa</Label>
                                        <Input name="email" type="email" defaultValue={profileWithOrg?.orgEmail ?? ''} placeholder="contato@empresa.com" className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider flex items-center gap-1.5"><Phone className="w-3 h-3" /> Telefone</Label>
                                        <Input name="phone" defaultValue={profileWithOrg?.orgPhone ?? ''} placeholder="(11) 99999-9999" className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider flex items-center gap-1.5"><Globe className="w-3 h-3" /> Website</Label>
                                        <Input name="website" defaultValue={profileWithOrg?.orgWebsite ?? ''} placeholder="https://www.empresa.com" className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Descrição</Label>
                                    <Input name="description" defaultValue={profileWithOrg?.orgDescription ?? ''} placeholder="Breve descrição da empresa" className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                </div>

                                <div className="pt-2">
                                    <Label className="text-foreground-secondary text-xs uppercase tracking-wider flex items-center gap-1.5 mb-3"><MapPin className="w-3 h-3" /> Endereço</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5 md:col-span-2">
                                            <Label className="text-muted-foreground text-xs">Logradouro</Label>
                                            <Input name="address" defaultValue={profileWithOrg?.orgAddress ?? ''} placeholder="Rua, número, complemento" className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-muted-foreground text-xs">Cidade</Label>
                                            <Input name="city" defaultValue={profileWithOrg?.orgCity ?? ''} placeholder="São Paulo" className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-muted-foreground text-xs">Estado</Label>
                                            <Input name="state" defaultValue={profileWithOrg?.orgState ?? ''} placeholder="SP" className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-muted-foreground text-xs">CEP</Label>
                                            <Input name="zipCode" defaultValue={profileWithOrg?.orgZipCode ?? ''} placeholder="00000-000" className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-muted-foreground text-xs">País</Label>
                                            <Input name="country" defaultValue={profileWithOrg?.orgCountry ?? 'BR'} className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" disabled={orgPending} className="mt-6 h-9 px-6 text-xs font-bold uppercase tracking-wider">
                                    {orgPending ? 'Salvando...' : 'Salvar Alterações'}
                                </Button>
                            </form>
                        </div>

                        <div className="bg-card border border-border p-6 rounded-(--radius)">
                            <h2 className="text-foreground font-bold tracking-tight mb-2">Seu Perfil</h2>
                            <p className="text-muted-foreground text-sm mb-6">Informações da sua conta de usuário.</p>

                            <form className="space-y-4 max-w-sm">
                                <div className="space-y-1.5">
                                    <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Nome Pessoal</Label>
                                    <Input defaultValue={profileWithOrg?.name} className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Email</Label>
                                    <Input readOnly defaultValue={profileWithOrg?.email} className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm opacity-50" />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Cargo / Papel</Label>
                                    <Input readOnly defaultValue={profileWithOrg?.role} className="bg-[hsl(var(--background-tertiary))] border-border text-primary uppercase font-bold tracking-wider rounded-(--radius) h-9 text-xs" />
                                </div>
                            </form>
                        </div>
                    </>
                )}

                {tab === 'integrations' && (
                    <div className="space-y-6">
                        <div className="bg-card border border-border p-6 rounded-(--radius)">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 rounded-(--radius) flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-foreground font-bold tracking-tight">Twilio SendGrid</h3>
                                        <p className="text-muted-foreground text-xs">Email marketing e transacional</p>
                                    </div>
                                </div>
                                <StatusBadge active={integrations.sendgrid} />
                            </div>
                            <div className="bg-[hsl(var(--secondary-subtle))] border border-border rounded-(--radius) p-4 space-y-2">
                                <p className="text-foreground-secondary text-xs font-bold uppercase tracking-wider">Variáveis de ambiente necessárias:</p>
                                <code className="block text-xs text-muted-foreground font-mono">SENDGRID_API_KEY</code>
                                <code className="block text-xs text-muted-foreground font-mono">SENDGRID_FROM_EMAIL</code>
                                <code className="block text-xs text-muted-foreground font-mono">SENDGRID_FROM_NAME</code>
                            </div>
                        </div>

                        <div className="bg-card border border-border p-6 rounded-(--radius)">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-50 dark:bg-green-950 rounded-(--radius) flex items-center justify-center">
                                        <MessageCircle className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-foreground font-bold tracking-tight">Twilio WhatsApp</h3>
                                        <p className="text-muted-foreground text-xs">Mensagens e inbox via WhatsApp</p>
                                    </div>
                                </div>
                                <StatusBadge active={integrations.twilioWhatsapp} />
                            </div>
                            <div className="bg-[hsl(var(--secondary-subtle))] border border-border rounded-(--radius) p-4 space-y-2">
                                <p className="text-foreground-secondary text-xs font-bold uppercase tracking-wider">Variáveis de ambiente necessárias:</p>
                                <code className="block text-xs text-muted-foreground font-mono">TWILIO_ACCOUNT_SID</code>
                                <code className="block text-xs text-muted-foreground font-mono">TWILIO_AUTH_TOKEN</code>
                                <code className="block text-xs text-muted-foreground font-mono">TWILIO_WHATSAPP_NUMBER</code>
                            </div>
                        </div>

                        <div className="bg-card border border-border p-6 rounded-(--radius)">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950 rounded-(--radius) flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-foreground font-bold tracking-tight">Twilio SMS</h3>
                                        <p className="text-muted-foreground text-xs">Envio de SMS para contatos</p>
                                    </div>
                                </div>
                                <StatusBadge active={integrations.twilioSms} />
                            </div>
                            <div className="bg-[hsl(var(--secondary-subtle))] border border-border rounded-(--radius) p-4 space-y-2">
                                <p className="text-foreground-secondary text-xs font-bold uppercase tracking-wider">Variáveis de ambiente necessárias:</p>
                                <code className="block text-xs text-muted-foreground font-mono">TWILIO_ACCOUNT_SID</code>
                                <code className="block text-xs text-muted-foreground font-mono">TWILIO_AUTH_TOKEN</code>
                                <code className="block text-xs text-muted-foreground font-mono">TWILIO_SMS_NUMBER</code>
                            </div>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-(--radius) p-4">
                            <p className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-1">Configuração</p>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                As integrações são configuradas via variáveis de ambiente no servidor.
                                Consulte a documentação para obter suas chaves API em{' '}
                                <span className="text-foreground font-medium">sendgrid.com</span> e{' '}
                                <span className="text-foreground font-medium">twilio.com</span>.
                            </p>
                        </div>
                    </div>
                )}

                {tab === 'knowledge' && (
                    <div className="space-y-4">
                        <div className="bg-card border border-border rounded-(--radius) p-6">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                    <BookOpen className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-foreground font-bold tracking-tight">Base de Conhecimento</h2>
                                    <p className="text-muted-foreground text-sm mt-0.5">
                                        Contexto estratégico que alimenta a IA para geração de conteúdo, chatbots e automações.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-(--radius) bg-[hsl(var(--background-tertiary))] border border-border mb-6">
                                <div className="text-center px-4 border-r border-border">
                                    <p className="text-2xl font-black text-foreground">{knowledgeEntryCount}</p>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Entradas</p>
                                </div>
                                <p className="text-sm text-muted-foreground flex-1">
                                    Gerencie perfil estratégico, entradas livres (FAQ, produtos, processos) e imagens indexadas para RAG.
                                </p>
                            </div>
                            <Link href="/knowledge-base">
                                <Button className="gap-2 h-9 px-5 text-xs font-bold uppercase tracking-wider">
                                    <BookOpen className="w-4 h-4" />
                                    Abrir Base de Conhecimento
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

                {tab === 'ai' && (
                    <div className="space-y-6">
                        {!aiGovernance?.available && (
                            <InlineNotice
                                variant="warning"
                                title="Migration pendente"
                                message="As tabelas de governança de IA ainda não estão disponíveis neste ambiente. Execute a migration 015_ai_governance.sql para habilitar métricas e limites."
                            />
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-card border border-border p-5 rounded-(--radius)">
                                <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Uso diário</p>
                                <p className="text-2xl font-bold text-foreground">{aiGovernance?.dailyRequestsUsed ?? 0} / {aiGovernance?.dailyRequestsLimit ?? 120}</p>
                                <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full bg-primary transition-all" style={{ width: `${dailyUsagePercent}%` }} />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">{dailyUsagePercent}% do limite diário utilizado</p>
                            </div>

                            <div className="bg-card border border-border p-5 rounded-(--radius)">
                                <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Orçamento mensal</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {formatCurrencyFromCents(aiGovernance?.monthlyCostCents ?? 0)} / {formatCurrencyFromCents(aiGovernance?.monthlyBudgetCents ?? 3000)}
                                </p>
                                <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full bg-primary transition-all" style={{ width: `${monthlyUsagePercent}%` }} />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {aiGovernance?.monthlySuccessCount ?? 0} chamadas com sucesso no mês
                                </p>
                            </div>
                        </div>

                        <div className="bg-card border border-border p-6 rounded-(--radius)">
                            <h2 className="text-foreground font-bold tracking-tight mb-2">Política de Limites de IA</h2>
                            <p className="text-muted-foreground text-sm mb-6">
                                Ajuste os limites para controlar volume e custo por organização.
                            </p>

                            {aiState.success && (
                                <InlineNotice variant="success" message="Política de IA atualizada com sucesso." className="mb-4" size="sm" />
                            )}
                            {aiState.error && (
                                <InlineNotice variant="destructive" message={aiState.error} className="mb-4" size="sm" />
                            )}

                            <form action={aiAction} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider flex items-center gap-1.5">
                                            <GaugeCircle className="w-3 h-3" /> Limite diário de requests
                                        </Label>
                                        <Input
                                            name="dailyRequestsLimit"
                                            type="number"
                                            min={1}
                                            defaultValue={aiGovernance?.dailyRequestsLimit ?? 120}
                                            className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Orçamento mensal (centavos)</Label>
                                        <Input
                                            name="monthlyBudgetCents"
                                            type="number"
                                            min={100}
                                            step={100}
                                            defaultValue={aiGovernance?.monthlyBudgetCents ?? 3000}
                                            className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="hardBlockEnabled"
                                        defaultChecked={aiGovernance?.hardBlockEnabled ?? true}
                                        className="h-4 w-4 rounded border-border"
                                    />
                                    Bloquear automaticamente quando atingir limites
                                </label>

                                <Button
                                    type="submit"
                                    disabled={aiPending}
                                    className="mt-2 h-9 px-6 text-xs font-bold uppercase tracking-wider"
                                >
                                    {aiPending ? 'Salvando...' : 'Salvar Política de IA'}
                                </Button>
                            </form>
                        </div>

                        <div className="bg-card border border-border p-6 rounded-(--radius) space-y-5">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div>
                                    <h2 className="text-foreground font-bold tracking-tight">Histórico de Uso IA</h2>
                                    <p className="text-muted-foreground text-sm">
                                        Eventos recentes para auditoria por feature, modelo e status.
                                    </p>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    {filteredEvents.length} eventos exibidos
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs uppercase tracking-wider text-foreground-secondary">Período</Label>
                                    <select
                                        value={period}
                                        onChange={(event) => setPeriod(event.target.value as '24h' | '7d' | '30d' | '90d')}
                                        className="h-9 w-full rounded-(--radius) border border-border bg-[hsl(var(--background-tertiary))] px-3 text-sm text-foreground"
                                    >
                                        <option value="24h">Últimas 24h</option>
                                        <option value="7d">Últimos 7 dias</option>
                                        <option value="30d">Últimos 30 dias</option>
                                        <option value="90d">Últimos 90 dias</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs uppercase tracking-wider text-foreground-secondary">Status</Label>
                                    <select
                                        value={statusFilter}
                                        onChange={(event) => setStatusFilter(event.target.value as 'all' | 'started' | 'success' | 'error' | 'blocked')}
                                        className="h-9 w-full rounded-(--radius) border border-border bg-[hsl(var(--background-tertiary))] px-3 text-sm text-foreground"
                                    >
                                        <option value="all">Todos</option>
                                        <option value="started">Started</option>
                                        <option value="success">Success</option>
                                        <option value="error">Error</option>
                                        <option value="blocked">Blocked</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs uppercase tracking-wider text-foreground-secondary">Feature</Label>
                                    <select
                                        value={featureFilter}
                                        onChange={(event) => setFeatureFilter(event.target.value)}
                                        className="h-9 w-full rounded-(--radius) border border-border bg-[hsl(var(--background-tertiary))] px-3 text-sm text-foreground"
                                    >
                                        <option value="all">Todas</option>
                                        {featureOptions.map((feature) => (
                                            <option key={feature} value={feature}>{feature}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs uppercase tracking-wider text-foreground-secondary">Modelo/Rota</Label>
                                    <Input
                                        value={modelQuery}
                                        onChange={(event) => setModelQuery(event.target.value)}
                                        placeholder="gemini, instagram..."
                                        className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="rounded-(--radius) border border-border p-3">
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Custo estimado (filtro)</p>
                                    <p className="text-xl font-bold text-foreground">{formatCurrencyFromCents(filteredCostCents)}</p>
                                </div>
                                <div className="rounded-(--radius) border border-border p-3">
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Sucessos</p>
                                    <p className="text-xl font-bold text-foreground">{filteredSuccessCount}</p>
                                </div>
                                <div className="rounded-(--radius) border border-border p-3">
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Bloqueios</p>
                                    <p className="text-xl font-bold text-foreground">{filteredBlockedCount}</p>
                                </div>
                            </div>

                            <div className="rounded-(--radius) border border-border p-4 space-y-3 bg-muted/20">
                                <div>
                                    <p className="text-sm font-bold text-foreground">Limpeza de histórico antigo</p>
                                    <p className="text-xs text-muted-foreground">
                                        Remove eventos anteriores ao período informado para reduzir volume de armazenamento.
                                    </p>
                                </div>

                                {purgeState.success && (
                                    <InlineNotice
                                        variant="success"
                                        size="sm"
                                        message={`Limpeza concluída: ${purgeState.deletedCount} evento(s) removido(s).`}
                                    />
                                )}
                                {purgeState.error && (
                                    <InlineNotice variant="destructive" size="sm" message={purgeState.error} />
                                )}

                                <form action={purgeAction} className="flex items-end gap-3 flex-wrap">
                                    <div className="space-y-1">
                                        <Label className="text-xs uppercase tracking-wider text-foreground-secondary">Manter últimos (dias)</Label>
                                        <Input
                                            name="retentionDays"
                                            type="number"
                                            min={1}
                                            max={3650}
                                            defaultValue={90}
                                            className="w-44 bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        disabled={purgePending}
                                        className="h-9 px-4 text-xs font-bold uppercase tracking-wider"
                                    >
                                        {purgePending ? 'Limpando...' : 'Limpar Histórico Antigo'}
                                    </Button>
                                </form>
                            </div>

                            <div className="rounded-(--radius) border border-border overflow-hidden">
                                <div className="max-h-105 overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/40 sticky top-0">
                                            <tr>
                                                <th className="text-left px-3 py-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">Data</th>
                                                <th className="text-left px-3 py-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                                                <th className="text-left px-3 py-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">Feature</th>
                                                <th className="text-left px-3 py-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">Modelo</th>
                                                <th className="text-left px-3 py-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">Custo</th>
                                                <th className="text-left px-3 py-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">Tempo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredEvents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                                                        Nenhum evento encontrado para os filtros selecionados.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredEvents.map((event) => (
                                                    <tr key={event.id} className="border-t border-border/60">
                                                        <td className="px-3 py-2 text-foreground-secondary whitespace-nowrap">{formatDateTime(event.createdAt)}</td>
                                                        <td className="px-3 py-2">
                                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold uppercase ${statusBadgeClassMap[event.status]}`}>
                                                                {event.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-foreground-secondary">{event.featureKey}</td>
                                                        <td className="px-3 py-2 text-foreground-secondary">
                                                            <div className="font-medium text-foreground">{event.model}</div>
                                                            <div className="text-xs text-muted-foreground">{event.routeScope}</div>
                                                        </td>
                                                        <td className="px-3 py-2 text-foreground-secondary whitespace-nowrap">{formatCurrencyFromCents(event.estimatedCostCents)}</td>
                                                        <td className="px-3 py-2 text-foreground-secondary whitespace-nowrap">
                                                            {event.durationMs ? `${event.durationMs}ms` : event.errorCode ? event.errorCode : '—'}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {tab === 'plan' && (
                    <div className="space-y-6">
                        {/* Resumo do plano */}
                        <div className="bg-card border border-border p-6 rounded-(--radius)">
                            <div className="flex items-start justify-between gap-4 mb-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                        <CreditCard className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-foreground font-bold tracking-tight">Plano Atual</h2>
                                        <p className="text-muted-foreground text-sm mt-0.5">
                                            {subscription ? subscription.planName : 'Sem assinatura ativa'}
                                        </p>
                                    </div>
                                </div>
                                {subscription && (
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase ${
                                        subscription.isActive()
                                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
                                            : subscription.isPastDue()
                                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                                                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                                    }`}>
                                        {subscription.statusLabel()}
                                    </span>
                                )}
                            </div>

                            {subscription ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="p-3 bg-[hsl(var(--background-tertiary))] rounded-(--radius) border border-border">
                                            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Créditos disponíveis</p>
                                            <p className="text-xl font-bold text-foreground mt-1">{subscription.creditsBalance.toLocaleString('pt-BR')}</p>
                                        </div>
                                        <div className="p-3 bg-[hsl(var(--background-tertiary))] rounded-(--radius) border border-border">
                                            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Cota mensal</p>
                                            <p className="text-xl font-bold text-foreground mt-1">{subscription.monthlyCredits.toLocaleString('pt-BR')}</p>
                                        </div>
                                        <div className="p-3 bg-[hsl(var(--background-tertiary))] rounded-(--radius) border border-border">
                                            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Renovação em</p>
                                            <p className="text-xl font-bold text-foreground mt-1">{subscription.daysUntilRenewal()}d</p>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                            <span>Uso de créditos</span>
                                            <span>{subscription.creditsPercent()}%</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all"
                                                style={{ width: `${subscription.creditsPercent()}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">Nenhuma assinatura encontrada. Entre em contato com o suporte.</p>
                            )}
                        </div>

                        {/* Tabela de custos */}
                        <div className="bg-card border border-border p-6 rounded-(--radius)">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                    <Zap className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-foreground font-bold tracking-tight">Custo por Operação</h2>
                                    <p className="text-muted-foreground text-sm mt-0.5">Créditos consumidos por cada ação na plataforma.</p>
                                </div>
                            </div>
                            <div className="rounded-(--radius) border border-border overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/40">
                                        <tr>
                                            <th className="text-left px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Operação</th>
                                            <th className="text-right px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Créditos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { label: 'Geração com IA', cost: 10 },
                                            { label: 'Envio WhatsApp (por mensagem)', cost: 5 },
                                            { label: 'Envio SMS (por mensagem)', cost: 2 },
                                            { label: 'Envio Email (por destinatário)', cost: 1 },
                                        ].map((row) => (
                                            <tr key={row.label} className="border-t border-border/60">
                                                <td className="px-4 py-2.5 text-foreground">{row.label}</td>
                                                <td className="px-4 py-2.5 text-right font-bold text-primary">{row.cost} cr</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Comprar créditos */}
                        {creditPacks.length > 0 && (
                            <div className="bg-card border border-border p-6 rounded-(--radius)">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                            <TrendingUp className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="text-foreground font-bold tracking-tight">Pacotes de Créditos</h2>
                                            <p className="text-muted-foreground text-sm mt-0.5">Adicione créditos avulsos quando precisar.</p>
                                        </div>
                                    </div>
                                    <BuyCreditsButton packs={creditPacks} />
                                </div>
                            </div>
                        )}

                        {/* Histórico */}
                        <div className="bg-card border border-border p-6 rounded-(--radius)">
                            <h2 className="text-foreground font-bold tracking-tight mb-4">Histórico de Créditos</h2>
                            <div className="rounded-(--radius) border border-border overflow-hidden">
                                <div className="max-h-96 overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/40 sticky top-0">
                                            <tr>
                                                <th className="text-left px-3 py-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">Data</th>
                                                <th className="text-left px-3 py-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">Tipo</th>
                                                <th className="text-left px-3 py-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">Descrição</th>
                                                <th className="text-right px-3 py-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">Qtd</th>
                                                <th className="text-right px-3 py-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {creditTransactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Nenhuma transação encontrada.</td>
                                                </tr>
                                            ) : (
                                                creditTransactions.map((tx) => (
                                                    <tr key={tx.id} className="border-t border-border/60">
                                                        <td className="px-3 py-2 text-foreground-secondary whitespace-nowrap">
                                                            {new Date(tx.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${
                                                                tx.isCredit()
                                                                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
                                                                    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                                                            }`}>
                                                                {tx.typeLabel()}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-foreground-secondary">{tx.description}</td>
                                                        <td className="px-3 py-2 text-right font-bold whitespace-nowrap">
                                                            <span className={tx.isCredit() ? 'text-[hsl(var(--success))]' : 'text-destructive'}>
                                                                {tx.isCredit() ? '+' : ''}{tx.amount.toLocaleString('pt-BR')}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-right text-foreground-secondary whitespace-nowrap">
                                                            {tx.balanceAfter.toLocaleString('pt-BR')}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

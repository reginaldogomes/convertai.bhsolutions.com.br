'use client'

import { useMemo, useState } from 'react'
import { useActionState } from 'react'
import { Building, Puzzle, Mail, MessageSquare, MessageCircle, CheckCircle2, XCircle, Globe, Phone, MapPin, Sparkles, GaugeCircle, BookOpen, ArrowRight, CreditCard, Zap, TrendingUp, Users, UserPlus, UserMinus, Shield, Crown, Eye, User as UserIcon, Loader2, Pencil, Trash2, Tags, Check, X, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { purgeAiUsageHistory, updateAiGovernancePolicy, updateOrganization, updateOrgBrand } from '@/actions/organization'
import { DESIGN_PRESETS, DEFAULT_DESIGN_SYSTEM } from '@/domain/value-objects/design-system'
import type { DesignSystem } from '@/domain/value-objects/design-system'
import { inviteMember, updateMemberRole, removeMember } from '@/actions/members'
import { createDepartment, updateDepartment, deleteDepartment, setUserDepartments } from '@/actions/departments'
import { roleBadgeClass, roleLabel, ASSIGNABLE_ROLES } from '@/lib/permissions'
import { BuyCreditsButton } from '@/components/crm/BuyCreditsButton'
import { InlineNotice } from '@/components/ui/inline-notice'
import { CustomDomainsSettings } from './custom-domains-settings'
import Link from 'next/link'

export interface PlainSubscription {
    planName: string
    status: string
    statusLabel: string
    isActive: boolean
    isPastDue: boolean
    creditsBalance: number
    monthlyCredits: number
    daysUntilRenewal: number
    creditsPercent: number
    currentPeriodEnd: string
}

export interface PlainCreditPack {
    id: string
    name: string
    credits: number
    formattedPrice: string
    costPerCredit: string
}

export interface PlainCreditTransaction {
    id: string
    createdAt: string
    isCredit: boolean
    typeLabel: string
    description: string
    amount: number
    balanceAfter: number
}

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
    subscription: PlainSubscription | null
    creditPacks: PlainCreditPack[]
    creditTransactions: PlainCreditTransaction[]
    members: PlainOrgMember[]
    departments: PlainDepartment[]
    currentUserId: string
    currentRole: string
    customDomains: Array<{
        id: string
        domain: string
        status: 'pending' | 'active' | 'error'
        createdAt: string
        verifiedAt: string | null
        target: {
            id: string | null
            name: string
            slug: string
        } | null
    }>
    landingPages: Array<{
        id: string
        name: string
    }>
    orgBrandJson: Record<string, unknown>
}

export interface PlainDepartment {
    id: string
    name: string
    color: string
}

export interface PlainOrgMember {
    id: string
    name: string
    email: string
    role: string
    avatarUrl: string | null
    createdAt: string
    initials: string
    roleLabel: string
    isOwner: boolean
    departments: PlainDepartment[]
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

<<<<<<< HEAD
export function SettingsTabs({ profileWithOrg, integrations, aiGovernance, aiUsageEvents, knowledgeEntryCount, subscription, creditPacks, creditTransactions, members, departments, currentUserId, currentRole, customDomains, landingPages }: Props) {
    const [tab, setTab] = useState<'org' | 'integrations' | 'knowledge' | 'ai' | 'plan' | 'team' | 'custom-domains'>('org')
=======
export function SettingsTabs({ profileWithOrg, orgBrandJson, integrations, aiGovernance, aiUsageEvents, knowledgeEntryCount, subscription, creditPacks, creditTransactions, members, currentUserId, currentRole, customDomains, landingPages }: Props) {
    const [tab, setTab] = useState<'org' | 'brand' | 'integrations' | 'knowledge' | 'ai' | 'plan' | 'team' | 'custom-domains'>('org')
>>>>>>> 9109ceb (feat: org-level design system (brand_json) with cascade to LPs and RAG indexing)
    const [orgState, orgAction, orgPending] = useActionState(updateOrganization, { error: '', success: false })
    const [brandState, brandAction, brandPending] = useActionState(updateOrgBrand, { error: '', success: false })
    const [selectedDesignSystem, setSelectedDesignSystem] = useState<DesignSystem>(() => {
        const ds = orgBrandJson as Partial<DesignSystem>
        if (ds?.palette && ds?.fontFamily) return ds as DesignSystem
        return DEFAULT_DESIGN_SYSTEM
    })
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
        // eslint-disable-next-line react-hooks/purity
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
                    variant={tab === 'brand' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setTab('brand')}
                    className="w-full justify-start gap-3 px-4 py-2.5 text-left text-sm font-bold"
                >
                    <Palette className={`w-4 h-4 ${tab === 'brand' ? 'text-primary' : ''}`} /> Identidade Visual
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
                <Button
                    type="button"
                    variant={tab === 'team' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setTab('team')}
                    className="w-full justify-start gap-3 px-4 py-2.5 text-left text-sm font-bold"
                >
                    <Users className={`w-4 h-4 ${tab === 'team' ? 'text-primary' : ''}`} /> Equipe
                </Button>
                <Button
                    type="button"
                    variant={tab === 'custom-domains' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setTab('custom-domains')}
                    className="w-full justify-start gap-3 px-4 py-2.5 text-left text-sm font-bold"
                >
                    <Globe className={`w-4 h-4 ${tab === 'custom-domains' ? 'text-primary' : ''}`} /> Domínios Personalizados
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

                {tab === 'brand' && (
                    <div className="bg-card border border-border p-6 rounded-(--radius) space-y-6">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                    <Palette className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-foreground font-bold tracking-tight">Identidade Visual</h2>
                                    <p className="text-muted-foreground text-xs mt-0.5">
                                        Design system padrão da organização — aplicado automaticamente em landing pages, sites, campanhas e conteúdo gerado por IA.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {brandState.success && (
                            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-(--radius)">
                                <p className="text-green-700 dark:text-green-300 text-sm font-medium">Identidade visual salva e indexada na base de conhecimento.</p>
                            </div>
                        )}
                        {brandState.error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-(--radius)">
                                <p className="text-destructive text-sm">{brandState.error}</p>
                            </div>
                        )}

                        {/* Preset picker */}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Presets de Design</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {DESIGN_PRESETS.map(preset => {
                                    const isActive = selectedDesignSystem.presetId === preset.id
                                    return (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => setSelectedDesignSystem(preset.designSystem)}
                                            className={`text-left p-3 rounded-(--radius) border transition-all ${isActive ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
                                        >
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div
                                                    className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                                                    style={{ background: preset.designSystem.palette.primary }}
                                                />
                                                <div
                                                    className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                                                    style={{ background: preset.designSystem.palette.background }}
                                                />
                                                <div
                                                    className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                                                    style={{ background: preset.designSystem.palette.accent }}
                                                />
                                            </div>
                                            <p className="text-xs font-bold text-foreground truncate">{preset.name}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{preset.description}</p>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Current selection summary */}
                        <div className="p-4 border border-border rounded-(--radius) bg-[hsl(var(--background-tertiary))] flex flex-wrap gap-3 items-center text-xs text-muted-foreground">
                            <span className="font-bold text-foreground uppercase tracking-wider text-[10px]">Selecionado:</span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full border border-white/20 inline-block" style={{ background: selectedDesignSystem.palette.primary }} />
                                {selectedDesignSystem.presetId ?? 'Personalizado'}
                            </span>
                            <span>Fonte: <strong>{selectedDesignSystem.fontFamily}</strong></span>
                            <span>Estilo: <strong>{selectedDesignSystem.style}</strong></span>
                            <span>Raio: <strong>{selectedDesignSystem.borderRadius}</strong></span>
                        </div>

                        <form action={brandAction}>
                            <input type="hidden" name="designSystem" value={JSON.stringify(selectedDesignSystem)} />
                            <Button
                                type="submit"
                                disabled={brandPending}
                                className="h-9 px-6 text-xs font-bold uppercase tracking-wider"
                            >
                                {brandPending ? 'Salvando...' : 'Salvar Identidade Visual'}
                            </Button>
                        </form>
                    </div>
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
                                        subscription.isActive
                                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
                                            : subscription.isPastDue
                                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                                                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                                    }`}>
                                        {subscription.statusLabel}
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
                                            <p className="text-xl font-bold text-foreground mt-1">{subscription.daysUntilRenewal}d</p>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                            <span>Uso de créditos</span>
                                            <span>{subscription.creditsPercent}%</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all"
                                                style={{ width: `${subscription.creditsPercent}%` }}
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
                                                                tx.isCredit
                                                                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
                                                                    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                                                            }`}>
                                                                {tx.typeLabel}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-foreground-secondary">{tx.description}</td>
                                                        <td className="px-3 py-2 text-right font-bold whitespace-nowrap">
                                                            <span className={tx.isCredit ? 'text-[hsl(var(--success))]' : 'text-destructive'}>
                                                                {tx.isCredit ? '+' : ''}{tx.amount.toLocaleString('pt-BR')}
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

                {tab === 'team' && (
                    <TeamTab
                        members={members}
                        departments={departments}
                        currentUserId={currentUserId}
                        currentRole={currentRole}
                    />
                )}

                {tab === 'custom-domains' && (
                    <CustomDomainsSettings
                        domains={customDomains}
                        pages={landingPages}
                    />
                )}
            </div>
        </div>
    )
}

// ─── TeamTab component ────────────────────────────────────────────────────────

const ROLE_ICON: Record<string, React.ReactNode> = {
    owner: <Crown className="w-3 h-3" />,
    admin: <Shield className="w-3 h-3" />,
    agent: <UserIcon className="w-3 h-3" />,
    viewer: <Eye className="w-3 h-3" />,
}

// ─── Department color palette ─────────────────────────────────────────────────

const DEPT_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#64748b',
]

// ─── DepartmentsPanel ─────────────────────────────────────────────────────────

interface DepartmentsPanelProps {
    departments: PlainDepartment[]
    canManage: boolean
}

function DepartmentsPanel({ departments, canManage }: DepartmentsPanelProps) {
    const [createState, createAction, creating] = useActionState(createDepartment, { error: '', success: false })
    const [editState, editAction, editing] = useActionState(updateDepartment, { error: '', success: false })
    const [showCreate, setShowCreate] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [selectedColor, setSelectedColor] = useState(DEPT_COLORS[0])
    const [editColor, setEditColor] = useState(DEPT_COLORS[0])
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
    const [deleteError, setDeleteError] = useState('')

    async function handleDelete(id: string) {
        const result = await deleteDepartment(id)
        if (result.error) setDeleteError(result.error)
        else setConfirmDelete(null)
    }

    return (
        <div className="bg-card border border-border p-6 rounded-(--radius) space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Tags className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground">Departamentos</h3>
                        <p className="text-xs text-muted-foreground">{departments.length} departamento{departments.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                {canManage && (
                    <Button type="button" size="sm" variant="outline" onClick={() => { setShowCreate(v => !v); setSelectedColor(DEPT_COLORS[0]) }}
                        className="h-8 px-3 text-xs gap-1.5">
                        <UserPlus className="w-3.5 h-3.5" />
                        Novo
                    </Button>
                )}
            </div>

            {/* Create form */}
            {showCreate && canManage && (
                <form action={createAction} className="p-4 border border-border rounded-(--radius) bg-[hsl(var(--background-tertiary))] space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Novo departamento</p>
                    {createState.error && <InlineNotice variant="destructive" message={createState.error} size="sm" />}
                    {createState.success && <InlineNotice variant="success" message="Departamento criado." size="sm" />}
                    <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nome</Label>
                            <Input name="name" placeholder="Ex: Comercial, Suporte, Marketing" className="h-9 text-sm" required />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Cor</Label>
                            <div className="flex gap-1 flex-wrap w-32">
                                {DEPT_COLORS.map(c => (
                                    <button key={c} type="button" onClick={() => setSelectedColor(c)}
                                        className="w-5 h-5 rounded-full border-2 transition-all"
                                        style={{ backgroundColor: c, borderColor: selectedColor === c ? '#fff' : 'transparent' }} />
                                ))}
                            </div>
                        </div>
                        <input type="hidden" name="color" value={selectedColor} />
                        <Button type="submit" disabled={creating} size="sm" className="h-9 px-4 text-xs font-bold uppercase">
                            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Criar'}
                        </Button>
                    </div>
                </form>
            )}

            {deleteError && <InlineNotice variant="destructive" message={deleteError} size="sm" />}

            {/* Department list */}
            {departments.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhum departamento criado ainda.
                </p>
            ) : (
                <div className="space-y-2">
                    {departments.map(dept => (
                        <div key={dept.id} className="flex items-center gap-3 p-3 border border-border rounded-(--radius) bg-[hsl(var(--background-tertiary))]">
                            {editingId === dept.id ? (
                                <form action={editAction} className="flex-1 flex items-center gap-2">
                                    <input type="hidden" name="id" value={dept.id} />
                                    <input type="hidden" name="color" value={editColor} />
                                    <div className="flex gap-1 flex-wrap">
                                        {DEPT_COLORS.map(c => (
                                            <button key={c} type="button" onClick={() => setEditColor(c)}
                                                className="w-4 h-4 rounded-full border-2 transition-all"
                                                style={{ backgroundColor: c, borderColor: editColor === c ? '#fff' : 'transparent' }} />
                                        ))}
                                    </div>
                                    <Input name="name" defaultValue={dept.name} className="h-7 text-xs flex-1" required />
                                    {editState.error && <span className="text-xs text-destructive">{editState.error}</span>}
                                    <Button type="submit" disabled={editing} size="sm" variant="default" className="h-7 px-2 text-xs">
                                        {editing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                    </Button>
                                    <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingId(null)}>
                                        <X className="w-3 h-3" />
                                    </Button>
                                </form>
                            ) : (
                                <>
                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: dept.color }} />
                                    <span className="flex-1 text-sm font-medium text-foreground">{dept.name}</span>
                                    {canManage && (
                                        <div className="flex gap-1">
                                            <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0"
                                                onClick={() => { setEditingId(dept.id); setEditColor(dept.color) }}>
                                                <Pencil className="w-3 h-3" />
                                            </Button>
                                            {confirmDelete === dept.id ? (
                                                <>
                                                    <Button type="button" size="sm" variant="destructive" className="h-7 px-2 text-xs"
                                                        onClick={() => handleDelete(dept.id)}>
                                                        Confirmar
                                                    </Button>
                                                    <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs"
                                                        onClick={() => setConfirmDelete(null)}>
                                                        Cancelar
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                    onClick={() => setConfirmDelete(dept.id)}>
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── DepartmentSelector ───────────────────────────────────────────────────────

interface DepartmentSelectorProps {
    memberId: string
    memberDepts: PlainDepartment[]
    allDepts: PlainDepartment[]
}

function DepartmentSelector({ memberId, memberDepts, allDepts }: DepartmentSelectorProps) {
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState<Set<string>>(new Set(memberDepts.map(d => d.id)))
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    async function save() {
        setSaving(true)
        setError('')
        const result = await setUserDepartments(memberId, Array.from(selected))
        setSaving(false)
        if (result.error) setError(result.error)
        else setOpen(false)
    }

    function toggle(id: string) {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    if (allDepts.length === 0) return null

    return (
        <div className="relative">
            {/* Existing dept badges + edit trigger */}
            <div className="flex flex-wrap gap-1 items-center">
                {memberDepts.map(d => (
                    <span key={d.id} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${d.color}20`, color: d.color, border: `1px solid ${d.color}40` }}>
                        {d.name}
                    </span>
                ))}
                <button type="button" onClick={() => { setOpen(v => !v); setSelected(new Set(memberDepts.map(d => d.id))) }}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded border border-dashed border-border hover:border-primary">
                    <Pencil className="w-2.5 h-2.5 inline mr-0.5" />
                    Editar
                </button>
            </div>

            {/* Dropdown multi-select */}
            {open && (
                <div className="absolute left-0 top-full mt-1 z-50 w-52 bg-popover border border-border rounded-(--radius) shadow-xl">
                    <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                        {allDepts.map(d => (
                            <label key={d.id} className="flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-muted/50 transition-colors">
                                <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggle(d.id)}
                                    className="accent-primary w-3.5 h-3.5" />
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                <span className="text-xs text-foreground flex-1">{d.name}</span>
                            </label>
                        ))}
                    </div>
                    {error && <p className="px-2 pb-1 text-[10px] text-destructive">{error}</p>}
                    <div className="flex gap-1 p-2 border-t border-border">
                        <Button type="button" size="sm" disabled={saving} onClick={save}
                            className="flex-1 h-7 text-xs font-bold">
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Salvar'}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}
                            className="h-7 px-2 text-xs">
                            Cancelar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── TeamTab ──────────────────────────────────────────────────────────────────

interface TeamTabProps {
    members: PlainOrgMember[]
    departments: PlainDepartment[]
    currentUserId: string
    currentRole: string
}

function TeamTab({ members, departments, currentUserId, currentRole }: TeamTabProps) {
    const [inviteState, inviteAction, invitePending] = useActionState(inviteMember, { error: '', success: false })
    const [removeState, removeAction, removePending] = useActionState(removeMember, { error: '', success: false })
    const [roleState, roleAction, rolePending] = useActionState(updateMemberRole, { error: '', success: false })
    const [showInvite, setShowInvite] = useState(false)
    const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

    const canInvite = currentRole === 'owner' || currentRole === 'admin'
    const canManage = currentRole === 'owner' || currentRole === 'admin'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-card border border-border p-6 rounded-(--radius)">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-foreground font-bold tracking-tight">Membros da Equipe</h2>
                            <p className="text-muted-foreground text-sm mt-0.5">
                                {members.length} membro{members.length !== 1 ? 's' : ''} na organização
                            </p>
                        </div>
                    </div>
                    {canInvite && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => setShowInvite(v => !v)}
                            className="h-9 px-4 text-xs font-bold uppercase tracking-wider gap-2 shrink-0"
                        >
                            <UserPlus className="w-4 h-4" />
                            Convidar
                        </Button>
                    )}
                </div>

                {/* Invite form */}
                {showInvite && canInvite && (
                    <div className="mb-6 p-4 border border-border rounded-(--radius) bg-[hsl(var(--background-tertiary))]">
                        <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Convidar por E-mail</h3>
                        {inviteState.success && (
                            <InlineNotice variant="success" message="Convite enviado com sucesso! O usuário receberá um e-mail." className="mb-3" size="sm" />
                        )}
                        {inviteState.error && (
                            <InlineNotice variant="destructive" message={inviteState.error} className="mb-3" size="sm" />
                        )}
                        <form action={inviteAction} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Nome</Label>
                                <Input
                                    name="name"
                                    placeholder="Nome completo"
                                    className="bg-background border-border text-foreground h-9 text-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-foreground-secondary text-xs uppercase tracking-wider">E-mail</Label>
                                <Input
                                    name="email"
                                    type="email"
                                    placeholder="email@empresa.com"
                                    className="bg-background border-border text-foreground h-9 text-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Papel</Label>
                                <div className="flex gap-2">
                                    <select
                                        name="role"
                                        defaultValue="agent"
                                        className="flex-1 h-9 text-sm border border-border rounded-(--radius) bg-background text-foreground px-3"
                                    >
                                        {ASSIGNABLE_ROLES.map(r => (
                                            <option key={r} value={r}>{roleLabel(r)}</option>
                                        ))}
                                    </select>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={invitePending}
                                        className="h-9 px-4 text-xs font-bold uppercase tracking-wider gap-1.5"
                                    >
                                        {invitePending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                                        Enviar
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Feedback de remoção / role */}
                {removeState.error && <InlineNotice variant="destructive" message={removeState.error} className="mb-4" size="sm" />}
                {roleState.error && <InlineNotice variant="destructive" message={roleState.error} className="mb-4" size="sm" />}

                {/* Members list */}
                <div className="rounded-(--radius) border border-border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                            <tr>
                                <th className="text-left px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Membro</th>
                                <th className="text-left px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-muted-foreground">E-mail</th>
                                <th className="text-left px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Papel</th>
                                {departments.length > 0 && (
                                    <th className="text-left px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Departamentos</th>
                                )}
                                {canManage && (
                                    <th className="text-right px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-muted-foreground">Ações</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(member => (
                                <tr key={member.id} className="border-t border-border/60 hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {member.avatarUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-xs font-bold text-primary">{member.initials}</span>
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-foreground leading-none">
                                                    {member.name}
                                                    {member.id === currentUserId && (
                                                        <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                                    <td className="px-4 py-3">
                                        {canManage && !member.isOwner && member.id !== currentUserId ? (
                                            <form action={roleAction} className="inline-flex items-center gap-2">
                                                <input type="hidden" name="userId" value={member.id} />
                                                <select
                                                    name="role"
                                                    defaultValue={member.role}
                                                    onChange={e => {
                                                        // auto-submit on change
                                                        const form = e.target.closest('form') as HTMLFormElement | null
                                                        form?.requestSubmit()
                                                    }}
                                                    disabled={rolePending}
                                                    className="h-7 text-xs border border-border rounded-(--radius) bg-background text-foreground px-2"
                                                >
                                                    {ASSIGNABLE_ROLES.map(r => (
                                                        <option key={r} value={r}>{roleLabel(r)}</option>
                                                    ))}
                                                </select>
                                            </form>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${roleBadgeClass(member.role)}`}>
                                                {ROLE_ICON[member.role]}
                                                {member.roleLabel}
                                            </span>
                                        )}
                                    </td>
                                    {departments.length > 0 && (
                                        <td className="px-4 py-3">
                                            {canManage ? (
                                                <DepartmentSelector
                                                    memberId={member.id}
                                                    memberDepts={member.departments}
                                                    allDepts={departments}
                                                />
                                            ) : (
                                                <div className="flex flex-wrap gap-1">
                                                    {member.departments.map(d => (
                                                        <span key={d.id} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                            style={{ backgroundColor: `${d.color}20`, color: d.color, border: `1px solid ${d.color}40` }}>
                                                            {d.name}
                                                        </span>
                                                    ))}
                                                    {member.departments.length === 0 && (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    )}
                                    {canManage && (
                                        <td className="px-4 py-3 text-right">
                                            {!member.isOwner && member.id !== currentUserId && (
                                                confirmRemove === member.id ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <form action={removeAction}>
                                                            <input type="hidden" name="userId" value={member.id} />
                                                            <Button
                                                                type="submit"
                                                                variant="destructive"
                                                                size="sm"
                                                                disabled={removePending}
                                                                className="h-7 px-3 text-xs font-bold gap-1"
                                                            >
                                                                {removePending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmar'}
                                                            </Button>
                                                        </form>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setConfirmRemove(null)}
                                                            className="h-7 px-3 text-xs"
                                                        >
                                                            Cancelar
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setConfirmRemove(member.id)}
                                                        className="h-7 px-3 text-xs text-destructive hover:text-destructive gap-1"
                                                    >
                                                        <UserMinus className="w-3.5 h-3.5" />
                                                        Remover
                                                    </Button>
                                                )
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <DepartmentsPanel departments={departments} canManage={canManage} />

            {/* Role legend */}
            <div className="bg-card border border-border p-6 rounded-(--radius)">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Níveis de Acesso</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        { role: 'owner', desc: 'Acesso total, incluindo plano, faturamento e transferência de propriedade.' },
                        { role: 'admin', desc: 'Gerencia equipe, campanhas, contatos e configurações. Não acessa faturamento.' },
                        { role: 'agent', desc: 'Cria e edita campanhas, contatos e negocia deals. Não gerencia equipe.' },
                        { role: 'viewer', desc: 'Acesso somente leitura. Não pode criar ou modificar nada.' },
                    ].map(({ role, desc }) => (
                        <div key={role} className="flex items-start gap-3 p-3 rounded-(--radius) bg-[hsl(var(--background-tertiary))] border border-border">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold shrink-0 mt-0.5 ${roleBadgeClass(role)}`}>
                                {ROLE_ICON[role]}
                                {roleLabel(role)}
                            </span>
                            <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

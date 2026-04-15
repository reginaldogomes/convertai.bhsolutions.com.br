'use client'

import { useActionState } from 'react'
import { upsertPlan } from '@/actions/saas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft } from 'lucide-react'
import { InlineNotice } from '@/components/ui/inline-notice'
import Link from 'next/link'
import type { Plan } from '@/domain/entities/plan'

interface PlanFormProps {
    plan: Plan | null
}

function LimitInput({
    name,
    label,
    defaultValue,
}: {
    name: string
    label: string
    defaultValue: number
}) {
    return (
        <div className="space-y-2">
            <Label className="text-foreground-secondary text-xs uppercase tracking-wider">{label}</Label>
            <Input
                name={name}
                type="number"
                defaultValue={defaultValue}
                min={-1}
                className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9"
                required
            />
        </div>
    )
}

export function PlanForm({ plan }: PlanFormProps) {
    const [state, action, pending] = useActionState(upsertPlan, { error: '', success: false })

    return (
        <form action={action} className="space-y-8">
            {state.success && (
                <InlineNotice variant="success" message="Plano salvo com sucesso!" className="mb-2" size="sm" />
            )}
            {state.error && (
                <InlineNotice variant="destructive" message={state.error} className="mb-2" size="sm" />
            )}

            <input type="hidden" name="id" value={plan?.id ?? ''} />

            {/* Informações Básicas */}
            <section className="space-y-4">
                <h3 className="text-foreground text-sm font-semibold border-b border-border pb-2">Informações Básicas</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Nome do Plano</Label>
                        <Input
                            name="name"
                            defaultValue={plan?.name ?? ''}
                            placeholder="Ex: Pro, Empresarial..."
                            className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Ordem de Exibição</Label>
                        <Input
                            name="sortOrder"
                            type="number"
                            defaultValue={plan?.props.sortOrder ?? 0}
                            min={0}
                            className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Descrição Curta</Label>
                    <Input
                        name="description"
                        defaultValue={plan?.description ?? ''}
                        placeholder="Descrição resumida exibida na página de preços"
                        className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="isActiveCheckbox"
                        name="isActiveCheckbox"
                        defaultChecked={plan ? plan.isActive : true}
                        className="w-4 h-4 rounded border-border accent-primary"
                    />
                    <Label htmlFor="isActiveCheckbox" className="text-foreground text-sm cursor-pointer">
                        Plano ativo (visível para novas assinaturas)
                    </Label>
                </div>
            </section>

            {/* Precificação e Créditos */}
            <section className="space-y-4">
                <h3 className="text-foreground text-sm font-semibold border-b border-border pb-2">Precificação e Créditos</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Preço Mensal (R$)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                            <Input
                                name="priceBrl"
                                type="number"
                                step="0.01"
                                min={0}
                                defaultValue={plan?.priceBrl ?? ''}
                                placeholder="0,00"
                                className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9 pl-9"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Créditos Mensais</Label>
                        <Input
                            name="monthlyCredits"
                            type="number"
                            min={0}
                            defaultValue={plan?.monthlyCredits ?? ''}
                            placeholder="Ex: 1000"
                            className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9"
                            required
                        />
                        <p className="text-xs text-muted-foreground">Créditos concedidos ao iniciar ou renovar o plano.</p>
                    </div>
                </div>
            </section>

            {/* Limites de Uso */}
            <section className="space-y-4">
                <div>
                    <h3 className="text-foreground text-sm font-semibold border-b border-border pb-2">Limites de Uso</h3>
                    <p className="text-muted-foreground text-xs mt-2">Use <strong>-1</strong> para ilimitado.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <LimitInput name="maxContacts" label="Contatos" defaultValue={plan?.maxContacts ?? -1} />
                    <LimitInput name="maxLandingPages" label="Landing Pages" defaultValue={plan?.maxLandingPages ?? -1} />
                    <LimitInput name="maxUsers" label="Usuários" defaultValue={plan?.maxUsers ?? -1} />
                    <LimitInput name="maxAutomations" label="Automações" defaultValue={plan?.maxAutomations ?? -1} />
                </div>
            </section>

            {/* Recursos */}
            <section className="space-y-4">
                <h3 className="text-foreground text-sm font-semibold border-b border-border pb-2">Recursos do Plano</h3>
                <div className="space-y-2">
                    <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Recursos (um por linha)</Label>
                    <Textarea
                        name="features"
                        defaultValue={(plan?.features ?? []).join('\n')}
                        placeholder={'Envio de campanhas por email\nIntegração com WhatsApp\nChat com IA\nCréditos mensais incluídos'}
                        className="bg-[hsl(var(--background-tertiary))] border-border text-foreground font-mono text-xs"
                        rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                        Cada linha será exibida como um recurso na página de preços e na comparação de planos.
                    </p>
                </div>
            </section>

            {/* Ações */}
            <div className="flex items-center justify-between pt-2">
                <Link href="/admin/plans">
                    <Button type="button" variant="ghost" className="h-9 px-4 text-xs gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </Button>
                </Link>
                <Button
                    type="submit"
                    disabled={pending}
                    className="h-9 px-5 text-xs font-bold uppercase tracking-wider gap-2"
                >
                    {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : plan ? 'Salvar Alterações' : 'Criar Plano'}
                </Button>
            </div>
        </form>
    )
}

'use client'

import { useState, useTransition } from 'react'
import { adminUpdatePlanLimits } from '@/actions/admin'
import type { PlanConfig } from '@/domain/entities/plan'
import { Settings2, Save, Loader2 } from 'lucide-react'

interface Props {
    plan: PlanConfig
}

const FIELDS = [
    { key: 'landingPagesLimit', label: 'Landing Pages', hint: '-1 = ilimitado' },
    { key: 'contactsLimit', label: 'Contatos', hint: '-1 = ilimitado' },
    { key: 'emailsMonthlyLimit', label: 'Emails / mês', hint: '-1 = ilimitado' },
    { key: 'whatsappMonthlyLimit', label: 'WhatsApp / mês', hint: '-1 = ilimitado' },
    { key: 'automationsLimit', label: 'Automações ativas', hint: '-1 = ilimitado' },
    { key: 'knowledgeBaseLimit', label: 'Docs Base de Conhecimento', hint: '-1 = ilimitado' },
] as const

export function EditPlanCard({ plan }: Props) {
    const [isPending, startTransition] = useTransition()
    const [saved, setSaved] = useState(false)
    const [values, setValues] = useState({
        name: plan.name,
        priceBrl: plan.priceBrl,
        ...plan.limits,
    })

    function handleChange(field: string, value: string) {
        setValues(prev => ({
            ...prev,
            [field]: field === 'name' ? value : Number(value),
        }))
        setSaved(false)
    }

    function handleSave() {
        startTransition(async () => {
            await adminUpdatePlanLimits(plan.id, {
                name: values.name,
                priceBrl: values.priceBrl,
                landingPagesLimit: values.landingPagesLimit,
                contactsLimit: values.contactsLimit,
                emailsMonthlyLimit: values.emailsMonthlyLimit,
                whatsappMonthlyLimit: values.whatsappMonthlyLimit,
                automationsLimit: values.automationsLimit,
                knowledgeBaseLimit: values.knowledgeBaseLimit,
            })
            setSaved(true)
        })
    }

    return (
        <div className="bg-card border border-border rounded-(--radius) p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-primary" />
                    <h3 className="text-foreground font-bold text-sm uppercase tracking-wider">{plan.id}</h3>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex items-center gap-1.5 bg-primary hover:bg-[hsl(var(--primary-hover))] text-white h-7 px-3 text-xs font-bold uppercase tracking-wider rounded-(--radius) transition-colors disabled:opacity-50"
                >
                    {isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <Save className="w-3 h-3" />
                    )}
                    {saved && !isPending ? 'Salvo!' : 'Salvar'}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium block mb-1">
                            Nome do Plano
                        </label>
                        <input
                            type="text"
                            value={values.name}
                            onChange={e => handleChange('name', e.target.value)}
                            className="w-full bg-background border border-border rounded-(--radius) px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium block mb-1">
                            Preço (R$)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={values.priceBrl}
                            onChange={e => handleChange('priceBrl', e.target.value)}
                            className="w-full bg-background border border-border rounded-(--radius) px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono-data"
                        />
                    </div>
                </div>

                {FIELDS.map(({ key, label, hint }) => (
                    <div key={key}>
                        <label className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium block mb-1">
                            {label}
                            <span className="ml-1 text-muted-foreground/40 normal-case">{hint}</span>
                        </label>
                        <input
                            type="number"
                            min="-1"
                            value={values[key]}
                            onChange={e => handleChange(key, e.target.value)}
                            className="w-full bg-background border border-border rounded-(--radius) px-3 py-1.5 text-sm font-mono-data text-foreground focus:outline-none focus:border-primary"
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

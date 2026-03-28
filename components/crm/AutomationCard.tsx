'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleAutomation, deleteAutomation } from '@/actions/automations'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

interface Props {
    id: string
    name: string
    triggerLabel: string
    stepCount: number
    active: boolean
}

export function AutomationCard({ id, name, triggerLabel, stepCount, active: initialActive }: Props) {
    const [active, setActive] = useState(initialActive)
    const [isPendingToggle, startToggle] = useTransition()
    const [isPendingDelete, startDelete] = useTransition()
    const router = useRouter()

    function handleToggle() {
        const next = !active
        setActive(next) // optimistic
        startToggle(async () => {
            const result = await toggleAutomation(id, next)
            if (!result.success) {
                setActive(!next) // rollback
                toast.error(result.error ?? 'Erro ao atualizar automação')
            } else {
                toast.success(next ? 'Automação ativada' : 'Automação desativada')
                router.refresh()
            }
        })
    }

    function handleDelete() {
        if (!confirm(`Excluir a automação "${name}"? Esta ação não pode ser desfeita.`)) return
        startDelete(async () => {
            const result = await deleteAutomation(id)
            if (!result.success) {
                toast.error(result.error ?? 'Erro ao excluir automação')
            } else {
                toast.success('Automação excluída')
                router.refresh()
            }
        })
    }

    return (
        <div className={`bg-card border p-5 relative group transition-colors rounded-(--radius) ${isPendingDelete ? 'opacity-50 pointer-events-none' : 'hover:border-primary/50 border-border'}`}>
            {/* Status + Toggle */}
            <div className="absolute top-5 right-5 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${active ? 'bg-[hsl(var(--success))] shadow-[0_0_8px_hsl(var(--success)/0.5)]' : 'bg-muted-foreground/40'}`} />
                <button
                    type="button"
                    onClick={handleToggle}
                    disabled={isPendingToggle || isPendingDelete}
                    className={`text-[10px] uppercase font-bold tracking-widest transition-colors ${active ? 'text-[hsl(var(--success))] hover:text-destructive' : 'text-muted-foreground hover:text-primary'} disabled:opacity-50`}
                    title={active ? 'Desativar automação' : 'Ativar automação'}
                >
                    {isPendingToggle ? '...' : active ? 'On' : 'Off'}
                </button>
            </div>

            <h3 className="text-foreground font-bold mb-1 pr-14 leading-tight">{name}</h3>
            <p className="text-primary text-[10px] uppercase tracking-wider font-bold mb-4 font-mono-data">
                {triggerLabel}
            </p>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-mono-data">
                    {stepCount} {stepCount === 1 ? 'Passo' : 'Passos'}
                </span>

                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPendingDelete || isPendingToggle}
                    title="Excluir automação"
                    className="text-muted-foreground/40 hover:text-destructive transition-colors p-1 disabled:opacity-30"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}

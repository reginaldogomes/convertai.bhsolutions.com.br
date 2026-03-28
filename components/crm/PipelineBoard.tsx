'use client'

import { useState } from 'react'
import { moveDeal, createDeal } from '@/actions/deals'
import type { PipelineStage } from '@/types/database'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { useActionState } from 'react'
import { useEffect } from 'react'

const PIPELINE_STAGES: { id: PipelineStage; label: string }[] = [
    { id: 'novo_lead', label: 'Novo Lead' },
    { id: 'contato', label: 'Contato' },
    { id: 'proposta', label: 'Proposta' },
    { id: 'negociacao', label: 'Negociação' },
    { id: 'fechado_ganho', label: 'Fechado Ganho' },
    { id: 'fechado_perdido', label: 'Fechado Perdido' },
]

interface DealItem {
    id: string
    title: string
    pipeline_stage: PipelineStage
    value: number
    contacts: { name: string; company: string | null | undefined } | null
}

interface ContactOption {
    id: string
    name: string
}

export function PipelineBoard({ initialDeals, contacts }: { initialDeals: DealItem[], contacts: ContactOption[] }) {
    const [deals, setDeals] = useState(initialDeals)
    const [dealModalOpen, setDealModalOpen] = useState(false)
    const [state, action] = useActionState(createDeal, { error: '', success: false })
    const router = useRouter()

    useEffect(() => {
        if (state?.success) {
            toast.success('Deal criado com sucesso!')
            setDealModalOpen(false)
            router.refresh()
        } else if (state?.error) {
            toast.error(state.error)
        }
    }, [state])

    // Very simplified drag and drop without external libraries for this template
    const handleDrop = async (e: React.DragEvent, stageId: PipelineStage) => {
        e.preventDefault()
        const dealId = e.dataTransfer.getData('dealId')
        const deal = deals.find(d => d.id === dealId)

        if (!deal || deal.pipeline_stage === stageId) return

        // Optimistic update
        setDeals(prev => prev.map(d => d.id === dealId ? { ...d, pipeline_stage: stageId } : d))

        // Server mutation
        const res = await moveDeal(dealId, stageId)
        if (res?.error) {
            toast.error('Erro ao mover deal')
            // Revert
            setDeals(initialDeals)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleDragStart = (e: React.DragEvent, dealId: string) => {
        e.dataTransfer.setData('dealId', dealId)
    }

    return (
        <>
            <div className="flex gap-4 h-full">
                {PIPELINE_STAGES.map(stage => {
                    const stageDeals = deals.filter(d => d.pipeline_stage === stage.id)
                    const totalValue = stageDeals.reduce((acc, curr) => acc + Number(curr.value), 0)

                    return (
                        <div
                            key={stage.id}
                            className="w-72 shrink-0 flex flex-col h-full"
                            onDrop={(e) => handleDrop(e, stage.id)}
                            onDragOver={handleDragOver}
                        >
                            {/* Column Header */}
                            <div className="bg-card border border-border p-3 mb-3 flex items-center justify-between rounded-(--radius)">
                                <div>
                                    <h3 className="text-foreground text-sm font-bold tracking-wider uppercase">{stage.label}</h3>
                                    <p className="text-primary text-xs font-mono-data mt-1">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                                    </p>
                                </div>
                                <div className="text-muted-foreground text-xs font-mono-data bg-secondary px-1.5 py-0.5 rounded-(--radius)">{stageDeals.length}</div>
                            </div>

                            {/* Cards List */}
                            <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                                {stageDeals.map(deal => (
                                    <div
                                        key={deal.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, deal.id)}
                                        className="bg-[hsl(var(--background-tertiary))] border border-border p-4 cursor-grab active:cursor-grabbing hover:border-foreground-secondary transition-colors rounded-(--radius)"
                                    >
                                        <p className="text-foreground text-sm font-bold mb-1">{deal.title}</p>
                                        <p className="text-muted-foreground text-xs truncate mb-3">{deal.contacts?.name}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-foreground-secondary text-xs font-mono-data">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value)}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {stage.id === 'novo_lead' && (
                                    <button
                                        onClick={() => setDealModalOpen(true)}
                                        className="w-full py-3 border border-dashed border-border text-muted-foreground text-xs uppercase font-medium hover:border-foreground-secondary hover:text-foreground-secondary transition-colors flex items-center justify-center gap-1 rounded-(--radius)"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Novo Deal
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* New Deal Modal */}
            <Dialog open={dealModalOpen} onOpenChange={setDealModalOpen}>
                <DialogContent className="bg-[hsl(var(--background-tertiary))] border-border rounded-(--radius)">
                    <DialogHeader>
                        <DialogTitle className="text-foreground text-lg font-black tracking-tight">Nova Oportunidade</DialogTitle>
                    </DialogHeader>
                    <form action={action} className="space-y-4 py-4">
                        <input type="hidden" name="pipeline_stage" value="novo_lead" />

                        <div className="space-y-1.5">
                            <Label htmlFor="title" className="text-foreground-secondary text-xs uppercase tracking-wider">Título do Deal</Label>
                            <Input required id="title" name="title" className="bg-secondary border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="contact_id" className="text-foreground-secondary text-xs uppercase tracking-wider">Contato</Label>
                            <Select name="contact_id" required>
                                <SelectTrigger className="bg-secondary border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary">
                                    <SelectValue placeholder="Selecione o contato" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border text-foreground rounded-(--radius)">
                                    {contacts.map(c => (
                                        <SelectItem key={c.id} value={c.id} className="rounded-(--radius) focus:bg-primary focus:text-white cursor-pointer">
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="value" className="text-foreground-secondary text-xs uppercase tracking-wider">Valor (R$)</Label>
                            <Input type="number" required min="0" step="0.01" id="value" name="value" className="bg-secondary border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                        </div>

                        <Button type="submit" className="w-full bg-primary hover:bg-[hsl(var(--primary-hover))] text-white rounded-(--radius) h-9 font-bold uppercase tracking-wider text-xs">
                            Adicionar Deal
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

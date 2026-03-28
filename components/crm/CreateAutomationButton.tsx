'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createAutomation } from '@/actions/automations'
import { TRIGGER_EVENTS } from '@/application/use-cases/automations'
import { toast } from 'sonner'
import { Plus, Trash2, ArrowDown } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AutomationStep, AutomationWorkflow } from '@/domain/interfaces'

const STEP_TYPES: { value: AutomationStep['type']; label: string; description: string }[] = [
    { value: 'send_whatsapp', label: 'Enviar WhatsApp', description: 'Envia uma mensagem via WhatsApp' },
    { value: 'send_email', label: 'Enviar Email', description: 'Envia um email para o contato' },
    { value: 'add_tag', label: 'Adicionar Tag', description: 'Adiciona uma tag ao contato' },
    { value: 'assign_agent', label: 'Atribuir Agente IA', description: 'Vincula um agente de IA ao contato' },
    { value: 'wait', label: 'Aguardar', description: 'Pausa a automação por um período' },
]

const initialState = { error: '', success: false, id: undefined as string | undefined }

function StepConfig({ step, onChange }: { step: AutomationStep; onChange: (config: Record<string, unknown>) => void }) {
    switch (step.type) {
        case 'send_whatsapp':
            return (
                <div className="space-y-1.5">
                    <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Mensagem</Label>
                    <textarea
                        rows={2}
                        placeholder="Olá {{contact.name}}, seja bem-vindo(a)!"
                        value={(step.config.message as string) ?? ''}
                        onChange={e => onChange({ ...step.config, message: e.target.value })}
                        className="w-full bg-secondary border border-border text-foreground text-sm rounded-(--radius) px-3 py-2 resize-none focus:outline-none focus:border-primary"
                    />
                    <p className="text-muted-foreground/60 text-[10px]">Use {'{{contact.name}}'} para o nome do contato.</p>
                </div>
            )
        case 'send_email':
            return (
                <div className="space-y-2">
                    <div className="space-y-1.5">
                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Assunto</Label>
                        <Input
                            placeholder="Assunto do email"
                            value={(step.config.subject as string) ?? ''}
                            onChange={e => onChange({ ...step.config, subject: e.target.value })}
                            className="bg-secondary border-border text-foreground rounded-(--radius) h-8 text-sm focus:border-primary"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Mensagem</Label>
                        <textarea
                            rows={2}
                            placeholder="Conteúdo do email..."
                            value={(step.config.body as string) ?? ''}
                            onChange={e => onChange({ ...step.config, body: e.target.value })}
                            className="w-full bg-secondary border border-border text-foreground text-sm rounded-(--radius) px-3 py-2 resize-none focus:outline-none focus:border-primary"
                        />
                    </div>
                </div>
            )
        case 'add_tag':
            return (
                <div className="space-y-1.5">
                    <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Tag</Label>
                    <Input
                        placeholder="Ex: lead-quente"
                        value={(step.config.tag as string) ?? ''}
                        onChange={e => onChange({ ...step.config, tag: e.target.value })}
                        className="bg-secondary border-border text-foreground rounded-(--radius) h-8 text-sm focus:border-primary"
                    />
                </div>
            )
        case 'assign_agent':
            return (
                <div className="space-y-1.5">
                    <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Nome do Agente</Label>
                    <Input
                        placeholder="Ex: Agente de Vendas"
                        value={(step.config.agentName as string) ?? ''}
                        onChange={e => onChange({ ...step.config, agentName: e.target.value })}
                        className="bg-secondary border-border text-foreground rounded-(--radius) h-8 text-sm focus:border-primary"
                    />
                </div>
            )
        case 'wait':
            return (
                <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1.5">
                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Aguardar</Label>
                        <Input
                            type="number"
                            min="1"
                            placeholder="1"
                            value={(step.config.duration as string) ?? '1'}
                            onChange={e => onChange({ ...step.config, duration: e.target.value })}
                            className="bg-secondary border-border text-foreground rounded-(--radius) h-8 text-sm focus:border-primary"
                        />
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Unidade</Label>
                        <select
                            value={(step.config.unit as string) ?? 'hours'}
                            onChange={e => onChange({ ...step.config, unit: e.target.value })}
                            className="w-full bg-secondary border border-border text-foreground rounded-(--radius) h-8 text-sm px-2 focus:outline-none focus:border-primary"
                        >
                            <option value="minutes">Minutos</option>
                            <option value="hours">Horas</option>
                            <option value="days">Dias</option>
                        </select>
                    </div>
                </div>
            )
    }
}

export function CreateAutomationButton() {
    const [open, setOpen] = useState(false)
    const [steps, setSteps] = useState<AutomationStep[]>([])
    const [state, action, pending] = useActionState(createAutomation, initialState)
    const router = useRouter()

    useEffect(() => {
        if (state?.success) {
            toast.success('Automação criada com sucesso!')
            queueMicrotask(() => {
                setOpen(false)
                setSteps([])
                router.refresh()
            })
        } else if (state?.error) {
            toast.error(state.error)
        }
    }, [state, router])

    function addStep(type: AutomationStep['type']) {
        setSteps(prev => [...prev, { type, config: {} }])
    }

    function removeStep(index: number) {
        setSteps(prev => prev.filter((_, i) => i !== index))
    }

    function updateStepConfig(index: number, config: Record<string, unknown>) {
        setSteps(prev => prev.map((s, i) => i === index ? { ...s, config } : s))
    }

    const workflow: AutomationWorkflow = { steps }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white h-8 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-(--radius)"
            >
                <Plus className="w-3.5 h-3.5" />
                Novo Workflow
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-[hsl(var(--background-tertiary))] border-border rounded-(--radius) sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-foreground text-lg font-black tracking-tight">Novo Workflow de Automação</DialogTitle>
                    </DialogHeader>

                    <form
                        action={(formData) => {
                            formData.append('workflow_json', JSON.stringify(workflow))
                            action(formData)
                        }}
                        className="space-y-6 py-2"
                    >
                        {/* Name + Trigger */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-foreground-secondary text-xs uppercase tracking-wider">Nome da Automação</Label>
                                <Input
                                    required
                                    id="name"
                                    name="name"
                                    placeholder="Ex: Boas-vindas novo lead"
                                    className="bg-secondary border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="trigger_event" className="text-foreground-secondary text-xs uppercase tracking-wider">Gatilho</Label>
                                <select
                                    required
                                    id="trigger_event"
                                    name="trigger_event"
                                    className="w-full bg-secondary border border-border text-foreground rounded-(--radius) h-9 text-sm px-3 focus:outline-none focus:border-primary"
                                >
                                    <option value="">Selecione um gatilho...</option>
                                    {TRIGGER_EVENTS.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Workflow Steps */}
                        <div className="space-y-3">
                            <Label className="text-foreground-secondary text-xs uppercase tracking-wider block">Passos do Workflow</Label>

                            {steps.length > 0 && (
                                <div className="space-y-2">
                                    {steps.map((step, i) => {
                                        const stepType = STEP_TYPES.find(t => t.value === step.type)
                                        return (
                                            <div key={i} className="relative">
                                                <div className="bg-secondary border border-border rounded-(--radius) p-4 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <span className="text-[10px] text-muted-foreground/60 font-mono-data uppercase tracking-wider">Passo {i + 1}</span>
                                                            <p className="text-foreground text-sm font-bold">{stepType?.label}</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeStep(i)}
                                                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <StepConfig step={step} onChange={config => updateStepConfig(i, config)} />
                                                </div>
                                                {i < steps.length - 1 && (
                                                    <div className="flex justify-center py-1">
                                                        <ArrowDown className="w-4 h-4 text-muted-foreground/40" />
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Add Step */}
                            <div className="border border-dashed border-border rounded-(--radius) p-3">
                                <p className="text-muted-foreground/60 text-xs uppercase tracking-wider mb-2 font-bold">Adicionar passo</p>
                                <div className="flex flex-wrap gap-2">
                                    {STEP_TYPES.map(t => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => addStep(t.value)}
                                            title={t.description}
                                            className="text-xs bg-secondary/80 border border-border text-foreground-secondary hover:text-primary hover:border-primary/50 px-3 h-7 rounded-(--radius) transition-colors font-medium"
                                        >
                                            + {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2 border-t border-border">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="h-9 px-5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border rounded-(--radius) transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={pending || steps.length === 0}
                                className="bg-primary hover:bg-[hsl(var(--primary-hover))] disabled:opacity-50 disabled:cursor-not-allowed text-white h-9 px-6 text-xs font-bold uppercase tracking-wider rounded-(--radius) transition-colors"
                            >
                                {pending ? 'Criando...' : 'Criar Automação'}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

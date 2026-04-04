import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { PageHeader } from '@/components/layout/PageHeader'
import { Zap, Workflow } from 'lucide-react'
import { CreateAutomationButton } from '@/components/crm/CreateAutomationButton'
import { AutomationCard } from '@/components/crm/AutomationCard'
import { TRIGGER_EVENTS } from '@/application/use-cases/automations'

export default async function AutomationsPage() {
    const auth = await tryGetAuthContext()
    const automations = auth
        ? await useCases.listAutomations().execute(auth.orgId)
        : []

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                category="Processos"
                title="Automações"
                icon={Zap}
                actions={<CreateAutomationButton />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {automations.length === 0 && (
                    <div className="col-span-full border border-dashed border-border p-12 text-center flex flex-col items-center justify-center bg-secondary/50 rounded-(--radius)">
                        <Workflow className="w-8 h-8 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-sm">Nenhuma automação configurada.</p>
                        <p className="text-muted-foreground/60 text-xs mt-2 max-w-sm">Automatize o envio de emails, mensagens de WhatsApp ou atribuições de agentes de inteligência artificial.</p>
                    </div>
                )}

                {automations.map((auto) => {
                    const triggerLabel = TRIGGER_EVENTS.find(t => t.value === auto.triggerEvent)?.label ?? auto.triggerEvent
                    const stepCount = (auto.workflowJson?.steps?.length) ?? 0
                    return (
                        <AutomationCard
                            key={auto.id}
                            id={auto.id}
                            name={auto.name}
                            triggerLabel={triggerLabel}
                            stepCount={stepCount}
                            active={auto.active}
                        />
                    )
                })}
            </div>
        </div>
    )
}

import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { PageHeader } from '@/components/layout/PageHeader'
import { Zap, Plus, Workflow } from 'lucide-react'
import Link from 'next/link'

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
                actions={
                    <button className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white h-8 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-[var(--radius)]">
                        <Plus className="w-3.5 h-3.5" />
                        Novo Workflow
                    </button>
                }
            />

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {automations.length === 0 && (
                    <div className="col-span-full border border-dashed border-border p-12 text-center flex flex-col items-center justify-center bg-secondary/50 rounded-[var(--radius)]">
                        <Workflow className="w-8 h-8 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-sm">Nenhuma automação configurada.</p>
                        <p className="text-muted-foreground/60 text-xs mt-2 max-w-sm">Automatize o envio de emails, mensagens de WhatsApp ou atribuições de agentes de inteligência artificial.</p>
                    </div>
                )}

                {automations.map((auto) => (
                    <div key={auto.id} className="bg-card border border-border p-5 relative group hover:border-primary/50 transition-colors rounded-[var(--radius)]">
                        <div className="absolute top-5 right-5 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${auto.active ? 'bg-[hsl(var(--success))] shadow-[0_0_8px_hsl(var(--success)/0.5)]' : 'bg-muted-foreground/40'}`} />
                            <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">{auto.active ? 'On' : 'Off'}</span>
                        </div>

                        <h3 className="text-foreground font-bold mb-1 pr-12">{auto.name}</h3>
                        <p className="text-primary text-[10px] uppercase tracking-wider font-bold mb-4 font-mono-data">
                            Gatilho: {auto.trigger_event}
                        </p>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                            <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-mono-data">
                                {((auto.workflow_json as Record<string, unknown> | null)?.steps as unknown[] | undefined)?.length ?? 0} Passos
                            </span>
                            <button className="text-primary bg-primary/20 border-2 border-primary/50 hover:bg-primary/30 hover:border-primary/70 px-4 h-8 text-xs uppercase tracking-wider font-bold transition-colors rounded-[var(--radius)]">
                                Editar
                            </button>
                        </div>
                    </div>
                ))}

                {/* Example template cards */}
                {automations.length === 0 && (
                    <>
                        <div className="bg-[hsl(var(--background-tertiary))] border border-border p-5 opacity-50 relative pointer-events-none rounded-[var(--radius)]">
                            <h3 className="text-foreground font-bold mb-1">Boas-vindas WhatsApp</h3>
                            <p className="text-primary text-[10px] uppercase tracking-wider font-bold mb-4 font-mono-data">Gatilho: novo_lead</p>
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                                <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-mono-data">2 Passos</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

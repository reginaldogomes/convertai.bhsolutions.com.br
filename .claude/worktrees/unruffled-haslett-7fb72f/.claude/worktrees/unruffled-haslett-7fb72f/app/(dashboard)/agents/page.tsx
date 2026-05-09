import { PageHeader } from '@/components/layout/PageHeader'
import { Bot, Sparkles, UserCheck, MessageSquare, PenTool, Zap } from 'lucide-react'
import { BRAND } from '@/lib/brand'

const AGENTS = [
    {
        id: 'lead-qualification',
        name: 'Lead Qualification Agent',
        icon: UserCheck,
        description: 'Analisa novos leads em tempo real. Avalia o perfil, pontua com base no ICP e sugere as próximas ações para a equipe de vendas usando dados do CRM.',
        status: 'active',
    },
    {
        id: 'support',
        name: 'Support & Concierge Agent',
        icon: MessageSquare,
        description: 'Monitora a caixa de entrada do WhatsApp e Email. Sugere respostas baseadas no histórico de conversas ou responde automaticamente dúvidas frequentes.',
        status: 'active',
    },
    {
        id: 'marketing',
        name: 'Marketing Copy Agent',
        icon: PenTool,
        description: 'Gera copy envolvente para campanhas de email e mensagens em massa no WhatsApp, adaptando o tom de voz para cada segmento de clientes.',
        status: 'inactive',
    },
    {
        id: 'automation',
        name: 'Workflow Orchestrator',
        icon: Zap,
        description: 'Agente invisível que decide dinamicamente a próxima etapa de uma automação B2B sem precisar de fluxos fixos ("Se A então B").',
        status: 'inactive',
    }
]

export default function AgentsPage() {
    return (
        <div className="p-8 space-y-8">
            <PageHeader category={`${BRAND.name} Kit`} title="Agentes Inteligentes" icon={Bot} />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {AGENTS.map((agent) => {
                    const Icon = agent.icon
                    const isActive = agent.status === 'active'

                    return (
                        <div key={agent.id} className="relative group bg-card border border-border p-6 hover:border-primary/30 transition-colors rounded-(--radius)">
                            <div className="absolute top-6 right-6 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[hsl(var(--success))] shadow-[0_0_8px_hsl(var(--success)/0.5)]' : 'bg-muted-foreground'}`} />
                                <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">{isActive ? 'Ativo' : 'Desativado'}</span>
                            </div>

                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 bg-[hsl(var(--primary-subtle))] border border-primary flex items-center justify-center shrink-0 group-hover:bg-[hsl(var(--primary-soft))] transition-colors rounded-(--radius)">
                                    <Icon className="w-5 h-5 text-foreground-secondary group-hover:text-primary transition-colors" />
                                </div>
                                <div>
                                    <h3 className="text-foreground text-lg font-bold tracking-tight mb-1 pr-24">{agent.name}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{agent.description}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-6 border-t border-border">
                                <button className={`h-9 px-6 text-xs font-bold uppercase tracking-wider transition-colors rounded-(--radius) ${isActive
                                        ? 'bg-[hsl(var(--primary-subtle))] border-2 border-primary text-primary hover:bg-[hsl(var(--primary-soft))]'
                                        : 'bg-primary text-white hover:bg-[hsl(var(--primary-hover))]'
                                    }`}>
                                    {isActive ? 'Configurar Agent' : 'Ativar Agent'}
                                </button>
                                <button className="h-9 px-4 text-primary border-2 border-primary hover:border-primary bg-[hsl(var(--primary-subtle))] hover:bg-[hsl(var(--primary-soft))] flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors rounded-(--radius)">
                                    <Sparkles className="w-4 h-4" />
                                    Testar Prompt
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

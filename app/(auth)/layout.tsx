import { BRAND } from '@/lib/brand'

// Auth route group — does not use the dashboard layout
export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background flex">
            {/* Left: Brand Panel */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-border bg-[hsl(var(--background-secondary))]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary flex items-center justify-center rounded-[var(--radius)]">
                        <span className="text-primary-foreground font-black text-sm tracking-tighter">{BRAND.abbr}</span>
                    </div>
                    <span className="text-foreground font-bold text-lg tracking-tight">{BRAND.name}</span>
                </div>

                <div className="space-y-6">
                    <p className="text-muted-foreground/60 text-xs uppercase tracking-[0.2em] font-medium">Plataforma CRM</p>
                    <h1 className="text-foreground text-4xl font-black leading-none tracking-tight">
                        CRM.<br />
                        Comunicação.<br />
                        <span className="text-primary">Agentes de IA.</span>
                    </h1>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                        Centralize leads, atendimento WhatsApp, email marketing e automações em uma única plataforma.
                    </p>
                </div>

                <div className="flex gap-6 text-muted-foreground/50 text-xs uppercase tracking-widest">
                    <span>CRM</span>
                    <span>WhatsApp</span>
                    <span>Email</span>
                    <span>Automação</span>
                    <span>IA</span>
                </div>
            </div>

            {/* Right: Form Panel */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-sm">
                    {children}
                </div>
            </div>
        </div>
    )
}

import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { PageHeader } from '@/components/layout/PageHeader'
import { Settings as SettingsIcon, Building, Puzzle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default async function SettingsPage() {
    const auth = await tryGetAuthContext()
    const profileWithOrg = auth ? await useCases.getUserSettings().execute(auth.userId) : null

    return (
        <div className="p-8 space-y-8 max-w-4xl">
            <PageHeader category="Administração" title="Configurações" icon={SettingsIcon} />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Nav Tabs */}
                <div className="space-y-1">
                    <button className="w-full text-left px-4 py-2.5 bg-secondary text-foreground text-sm font-bold border-l-2 border-primary transition-colors flex items-center gap-3 rounded-(--radius)">
                        <Building className="w-4 h-4 text-primary" /> Organização
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary/70 text-sm font-medium border-l-2 border-transparent transition-colors flex items-center gap-3 rounded-(--radius)">
                        <Puzzle className="w-4 h-4" /> Integrações
                    </button>
                </div>

                {/* Content */}
                <div className="md:col-span-3 space-y-8">
                    <div className="bg-card border border-border p-6 rounded-(--radius)">
                        <h2 className="text-foreground font-bold tracking-tight mb-2">Perfil da Empresa</h2>
                        <p className="text-muted-foreground text-sm mb-6">Atualize os dados da sua organização.</p>

                        <form className="space-y-4">
                            <div className="space-y-1.5 max-w-sm">
                                <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Nome da Organização</Label>
                                <Input defaultValue={profileWithOrg?.orgName} className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                            </div>

                            <div className="space-y-1.5 max-w-sm">
                                <Label className="text-foreground-secondary text-xs uppercase tracking-wider">ID da Organização</Label>
                                <Input readOnly defaultValue={profileWithOrg?.orgId} className="bg-secondary/70 border-border-subtle text-foreground-secondary rounded-(--radius) h-9 text-sm font-mono-data opacity-50 select-all" />
                            </div>

                            <button type="button" className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white rounded-(--radius) h-9 px-6 font-bold uppercase tracking-wider text-xs transition-colors mt-6">
                                Salvar Alterações
                            </button>
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
                </div>
            </div>
        </div>
    )
}

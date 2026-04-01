'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { Building, Puzzle, Mail, MessageSquare, MessageCircle, CheckCircle2, XCircle, Globe, Phone, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateOrganization } from '@/actions/organization'

interface Props {
    profileWithOrg: {
        orgId: string
        orgName: string
        orgEmail: string | null
        orgPhone: string | null
        orgWebsite: string | null
        orgAddress: string | null
        orgCity: string | null
        orgState: string | null
        orgZipCode: string | null
        orgCountry: string | null
        orgDescription: string | null
        name: string
        email: string
        role: string
    } | null
    integrations: {
        sendgrid: boolean
        twilioWhatsapp: boolean
        twilioSms: boolean
    }
}

function StatusBadge({ active }: { active: boolean }) {
    return active ? (
        <span className="flex items-center gap-1 text-xs font-bold text-green-500">
            <CheckCircle2 className="w-3.5 h-3.5" /> Configurado
        </span>
    ) : (
        <span className="flex items-center gap-1 text-xs font-bold text-destructive">
            <XCircle className="w-3.5 h-3.5" /> Não configurado
        </span>
    )
}

export function SettingsTabs({ profileWithOrg, integrations }: Props) {
    const [tab, setTab] = useState<'org' | 'integrations'>('org')
    const [orgState, orgAction, orgPending] = useActionState(updateOrganization, { error: '', success: false })

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Nav Tabs */}
            <div className="space-y-1">
                <button
                    onClick={() => setTab('org')}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold border-l-2 transition-colors flex items-center gap-3 rounded-(--radius) ${tab === 'org'
                        ? 'bg-secondary text-foreground border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent border-transparent'
                        }`}
                >
                    <Building className={`w-4 h-4 ${tab === 'org' ? 'text-primary' : ''}`} /> Organização
                </button>
                <button
                    onClick={() => setTab('integrations')}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold border-l-2 transition-colors flex items-center gap-3 rounded-(--radius) ${tab === 'integrations'
                        ? 'bg-secondary text-foreground border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent border-transparent'
                        }`}
                >
                    <Puzzle className={`w-4 h-4 ${tab === 'integrations' ? 'text-primary' : ''}`} /> Integrações
                </button>
            </div>

            {/* Content */}
            <div className="md:col-span-3 space-y-8">
                {tab === 'org' && (
                    <>
                        <div className="bg-card border border-border p-6 rounded-(--radius)">
                            <h2 className="text-foreground font-bold tracking-tight mb-2">Perfil da Empresa</h2>
                            <p className="text-muted-foreground text-sm mb-6">Atualize os dados da sua organização.</p>

                            {orgState.success && (
                                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-(--radius)">
                                    <p className="text-green-700 dark:text-green-300 text-sm font-medium">Dados salvos com sucesso!</p>
                                </div>
                            )}
                            {orgState.error && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-(--radius)">
                                    <p className="text-red-700 dark:text-red-300 text-sm font-medium">{orgState.error}</p>
                                </div>
                            )}

                            <form action={orgAction} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Nome da Organização</Label>
                                        <Input name="name" defaultValue={profileWithOrg?.orgName} className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email da Empresa</Label>
                                        <Input name="email" type="email" defaultValue={profileWithOrg?.orgEmail ?? ''} placeholder="contato@empresa.com" className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider flex items-center gap-1.5"><Phone className="w-3 h-3" /> Telefone</Label>
                                        <Input name="phone" defaultValue={profileWithOrg?.orgPhone ?? ''} placeholder="(11) 99999-9999" className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-foreground-secondary text-xs uppercase tracking-wider flex items-center gap-1.5"><Globe className="w-3 h-3" /> Website</Label>
                                        <Input name="website" defaultValue={profileWithOrg?.orgWebsite ?? ''} placeholder="https://www.empresa.com" className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Descrição</Label>
                                    <Input name="description" defaultValue={profileWithOrg?.orgDescription ?? ''} placeholder="Breve descrição da empresa" className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                </div>

                                <div className="pt-2">
                                    <Label className="text-foreground-secondary text-xs uppercase tracking-wider flex items-center gap-1.5 mb-3"><MapPin className="w-3 h-3" /> Endereço</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5 md:col-span-2">
                                            <Label className="text-muted-foreground text-xs">Logradouro</Label>
                                            <Input name="address" defaultValue={profileWithOrg?.orgAddress ?? ''} placeholder="Rua, número, complemento" className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-muted-foreground text-xs">Cidade</Label>
                                            <Input name="city" defaultValue={profileWithOrg?.orgCity ?? ''} placeholder="São Paulo" className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-muted-foreground text-xs">Estado</Label>
                                            <Input name="state" defaultValue={profileWithOrg?.orgState ?? ''} placeholder="SP" className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-muted-foreground text-xs">CEP</Label>
                                            <Input name="zipCode" defaultValue={profileWithOrg?.orgZipCode ?? ''} placeholder="00000-000" className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-muted-foreground text-xs">País</Label>
                                            <Input name="country" defaultValue={profileWithOrg?.orgCountry ?? 'BR'} className="bg-[hsl(var(--background-tertiary))] border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary" />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={orgPending} className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white rounded-(--radius) h-9 px-6 font-bold uppercase tracking-wider text-xs transition-colors mt-6 disabled:opacity-50">
                                    {orgPending ? 'Salvando...' : 'Salvar Alterações'}
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
                    </>
                )}

                {tab === 'integrations' && (
                    <div className="space-y-6">
                        <div className="bg-card border border-border p-6 rounded-(--radius)">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 rounded-(--radius) flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-foreground font-bold tracking-tight">Twilio SendGrid</h3>
                                        <p className="text-muted-foreground text-xs">Email marketing e transacional</p>
                                    </div>
                                </div>
                                <StatusBadge active={integrations.sendgrid} />
                            </div>
                            <div className="bg-[hsl(var(--secondary-subtle))] border border-border rounded-(--radius) p-4 space-y-2">
                                <p className="text-foreground-secondary text-xs font-bold uppercase tracking-wider">Variáveis de ambiente necessárias:</p>
                                <code className="block text-xs text-muted-foreground font-mono">SENDGRID_API_KEY</code>
                                <code className="block text-xs text-muted-foreground font-mono">SENDGRID_FROM_EMAIL</code>
                                <code className="block text-xs text-muted-foreground font-mono">SENDGRID_FROM_NAME</code>
                            </div>
                        </div>

                        <div className="bg-card border border-border p-6 rounded-(--radius)">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-50 dark:bg-green-950 rounded-(--radius) flex items-center justify-center">
                                        <MessageCircle className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-foreground font-bold tracking-tight">Twilio WhatsApp</h3>
                                        <p className="text-muted-foreground text-xs">Mensagens e inbox via WhatsApp</p>
                                    </div>
                                </div>
                                <StatusBadge active={integrations.twilioWhatsapp} />
                            </div>
                            <div className="bg-[hsl(var(--secondary-subtle))] border border-border rounded-(--radius) p-4 space-y-2">
                                <p className="text-foreground-secondary text-xs font-bold uppercase tracking-wider">Variáveis de ambiente necessárias:</p>
                                <code className="block text-xs text-muted-foreground font-mono">TWILIO_ACCOUNT_SID</code>
                                <code className="block text-xs text-muted-foreground font-mono">TWILIO_AUTH_TOKEN</code>
                                <code className="block text-xs text-muted-foreground font-mono">TWILIO_WHATSAPP_NUMBER</code>
                            </div>
                        </div>

                        <div className="bg-card border border-border p-6 rounded-(--radius)">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950 rounded-(--radius) flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-foreground font-bold tracking-tight">Twilio SMS</h3>
                                        <p className="text-muted-foreground text-xs">Envio de SMS para contatos</p>
                                    </div>
                                </div>
                                <StatusBadge active={integrations.twilioSms} />
                            </div>
                            <div className="bg-[hsl(var(--secondary-subtle))] border border-border rounded-(--radius) p-4 space-y-2">
                                <p className="text-foreground-secondary text-xs font-bold uppercase tracking-wider">Variáveis de ambiente necessárias:</p>
                                <code className="block text-xs text-muted-foreground font-mono">TWILIO_ACCOUNT_SID</code>
                                <code className="block text-xs text-muted-foreground font-mono">TWILIO_AUTH_TOKEN</code>
                                <code className="block text-xs text-muted-foreground font-mono">TWILIO_SMS_NUMBER</code>
                            </div>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-(--radius) p-4">
                            <p className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-1">Configuração</p>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                As integrações são configuradas via variáveis de ambiente no servidor.
                                Consulte a documentação para obter suas chaves API em{' '}
                                <span className="text-foreground font-medium">sendgrid.com</span> e{' '}
                                <span className="text-foreground font-medium">twilio.com</span>.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

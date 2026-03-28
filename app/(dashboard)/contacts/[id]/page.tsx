import { useCases } from '@/application/services/container'
import { getAuthContext } from '@/infrastructure/auth'
import { notFound } from 'next/navigation'
import { Users, Building, Phone, Mail, Clock } from 'lucide-react'
import Link from 'next/link'
import { DeleteContactButton } from '@/components/crm/DeleteContactButton'

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { orgId } = await getAuthContext()

    const detail = await useCases.getContactDetail().execute(id, orgId)
    if (!detail) notFound()

    const { contact, messages, deals } = detail

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/contacts" className="text-muted-foreground text-xs uppercase hover:text-foreground transition-colors">← Voltar</Link>
                        <span className="text-muted-foreground/50 text-xs">/</span>
                        <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] font-medium">Contato</p>
                    </div>
                    <h1 className="text-foreground text-3xl font-black tracking-tight">{contact.name}</h1>
                </div>
                <DeleteContactButton contactId={contact.id} contactName={contact.name} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Col: Info */}
                <div className="space-y-6">
                    <div className="bg-card border border-border p-6 rounded-(--radius)">
                        <h2 className="text-foreground font-bold text-sm mb-4 uppercase tracking-wider">Detalhes do Contato</h2>
                        <div className="space-y-4">
                            {contact.email && (
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-foreground-secondary text-sm font-mono-data">{contact.email}</span>
                                </div>
                            )}
                            {contact.phone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-foreground-secondary text-sm font-mono-data">{contact.phone}</span>
                                </div>
                            )}
                            {contact.company && (
                                <div className="flex items-center gap-3">
                                    <Building className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-foreground-secondary text-sm">{contact.company}</span>
                                </div>
                            )}
                            <div className="pt-4 border-t border-border">
                                <p className="text-muted-foreground text-xs uppercase mb-2">Tags</p>
                                <div className="flex flex-wrap gap-2">
                                    {contact.tags.map((tag) => (
                                        <span key={tag} className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-semibold border border-primary/40 rounded-(--radius)">
                                            {tag}
                                        </span>
                                    ))}
                                    {contact.tags.length === 0 && (
                                        <span className="text-muted-foreground/50 text-xs italic">Sem tags</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-border p-6 rounded-(--radius)">
                        <h2 className="text-foreground font-bold text-sm mb-4 uppercase tracking-wider">Deals (Oportunidades)</h2>
                        <div className="space-y-3">
                            {deals.length === 0 && (
                                <p className="text-muted-foreground text-xs">Nenhum negócio em andamento.</p>
                            )}
                            {deals.map(deal => (
                                <div key={deal.id} className="p-3 border border-border-subtle bg-[hsl(var(--background-tertiary))] rounded-(--radius)">
                                    <p className="text-foreground text-sm font-medium">{deal.title}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-primary text-xs uppercase font-bold">{deal.pipelineStage.replace(/_/g, ' ')}</span>
                                        <span className="text-muted-foreground text-xs font-mono-data">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Col: Timeline */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-card border border-border p-6 h-full min-h-125 rounded-(--radius)">
                        <h2 className="text-foreground font-bold text-sm mb-6 uppercase tracking-wider">Histórico de Interações</h2>

                        <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 before:-translate-x-px before:w-px before:bg-border">
                            {messages.length === 0 && (
                                <p className="text-muted-foreground text-xs pl-8">Nenhuma interação registrada ainda.</p>
                            )}
                            {messages.map(msg => (
                                <div key={msg.id} className="relative pl-8">
                                    <div className={`absolute left-2.5 -translate-x-1/2 w-2 h-2 rounded-full ring-4 ring-card ${msg.isInbound() ? 'bg-primary' : 'bg-muted-foreground'}`} />
                                    <div className="bg-[hsl(var(--background-tertiary))] border border-border-subtle p-4 rounded-(--radius)">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-foreground text-xs font-bold uppercase tracking-wider">
                                                {msg.channel === 'whatsapp' ? 'WhatsApp' : 'Email'}
                                                {' · '}
                                                <span className={msg.isInbound() ? 'text-primary' : 'text-muted-foreground'}>
                                                    {msg.isInbound() ? 'Recebido' : 'Enviado'}
                                                </span>
                                            </span>
                                            <span className="text-muted-foreground text-xs font-mono-data flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(msg.createdAt).toLocaleString('pt-BR')}
                                            </span>
                                        </div>
                                        <p className="text-foreground-secondary text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

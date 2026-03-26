import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { MessageSquare, Calendar, Phone } from 'lucide-react'
import { InboxMessageInput } from '@/components/crm/InboxMessageInput'
import { InboxRealtimeListener } from '@/components/crm/InboxRealtimeListener'

export default async function InboxPage() {
    const auth = await tryGetAuthContext()
    const threads = auth
        ? await useCases.listThreads().execute(auth.orgId)
        : []

    return (
        <div className="flex h-full">
            {/* Realtime subscription for live updates */}
            {auth && <InboxRealtimeListener orgId={auth.orgId} />}

            {/* Sidebar (Threads) */}
            <div className="w-[320px] border-r border-border bg-[hsl(var(--background-secondary))] flex flex-col h-full shrink-0">
                <div className="p-5 border-b border-border">
                    <h2 className="text-foreground text-lg font-black tracking-tight flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        Inbox
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {threads.length === 0 && (
                        <p className="p-5 text-muted-foreground text-xs text-center">Nenhuma conversa encontrada.</p>
                    )}
                    {threads.map((thread, idx) => (
                        <div key={thread.contact.id} className={`p-4 border-b border-border cursor-pointer hover:bg-secondary/70 transition-colors ${idx === 0 ? 'bg-secondary' : ''}`}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-foreground font-bold text-sm truncate pr-2">{thread.contact.name}</span>
                                <span className="text-muted-foreground/60 text-[10px] font-mono-data shrink-0">
                                    {new Date(thread.lastActivity).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                                <Phone className="w-3 h-3" />
                                <span className="text-xs font-mono-data">{thread.contact.phone || 'Sem número'}</span>
                            </div>
                            <p className="text-foreground-secondary text-xs line-clamp-1">
                                {thread.messages[0].direction === 'outbound' ? 'Você: ' : ''}
                                {thread.messages[0].content}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Area (Thread Content) */}
            <div className="flex-1 flex flex-col bg-[hsl(var(--background-tertiary))]">
                {threads.length > 0 ? (
                    <>
                        <div className="p-5 border-b border-border bg-card flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-foreground font-bold">{threads[0].contact.name}</h3>
                                <span className="text-muted-foreground text-xs font-mono-data">{threads[0].contact.phone}</span>
                            </div>
                            <button className="text-xs uppercase font-bold tracking-wider text-white hover:bg-[hsl(var(--primary-hover))] transition-colors border-0 px-4 py-1.5 bg-primary rounded-[var(--radius)]">
                                Assistente IA
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col-reverse">
                            {threads[0].messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-4 rounded-[var(--radius)] ${msg.direction === 'outbound' ? 'bg-primary/20 border border-primary/40' : 'bg-secondary border border-border'}`}>
                                        <p className="text-foreground/90 text-sm whitespace-pre-wrap">{msg.content}</p>
                                        <div className="mt-2 text-right">
                                            <span className={`text-[10px] font-mono-data ${msg.direction === 'outbound' ? 'text-primary/60' : 'text-muted-foreground'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input area */}
                        <InboxMessageInput contactId={threads[0].contact.id} />
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center flex-col gap-4">
                        <MessageSquare className="w-12 h-12 text-muted-foreground/30" />
                        <p className="text-muted-foreground/60 text-sm">Nenhuma conversa selecionada</p>
                    </div>
                )}
            </div>
        </div>
    )
}

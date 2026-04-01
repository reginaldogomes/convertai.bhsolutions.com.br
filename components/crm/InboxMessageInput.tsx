'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { sendMessage } from '@/actions/messages'
import { toast } from 'sonner'
import { MessageSquare, Mail, Phone } from 'lucide-react'

const initialState = { error: '', success: false }

const channels = [
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { value: 'sms', label: 'SMS', icon: Phone },
    { value: 'email', label: 'Email', icon: Mail },
] as const

export function InboxMessageInput({ contactId }: { contactId: string }) {
    const [state, action] = useActionState(sendMessage, initialState)
    const formRef = useRef<HTMLFormElement>(null)
    const [channel, setChannel] = useState<string>('whatsapp')

    useEffect(() => {
        if (state?.success) {
            formRef.current?.reset()
        } else if (state?.error) {
            toast.error(state.error)
        }
    }, [state])

    return (
        <div className="p-5 border-t border-border bg-card shrink-0 space-y-3">
            {/* Channel selector */}
            <div className="flex items-center gap-1">
                {channels.map((ch) => {
                    const Icon = ch.icon
                    return (
                        <button
                            key={ch.value}
                            type="button"
                            onClick={() => setChannel(ch.value)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors rounded-(--radius) ${
                                channel === ch.value
                                    ? 'bg-primary text-white'
                                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                            }`}
                        >
                            <Icon className="w-3 h-3" />
                            {ch.label}
                        </button>
                    )
                })}
            </div>

            <form ref={formRef} action={action} className="flex gap-3">
                <input type="hidden" name="contact_id" value={contactId} />
                <input type="hidden" name="channel" value={channel} />
                <input
                    name="content"
                    type="text"
                    required
                    placeholder={channel === 'email' ? 'Digite o conteúdo do email...' : 'Digite uma mensagem...'}
                    className="flex-1 bg-secondary border border-border text-foreground placeholder:text-muted-foreground/60 px-4 h-11 text-sm focus:outline-none focus:border-primary transition-colors rounded-(--radius)"
                />
                <button
                    type="submit"
                    className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white px-6 h-11 font-bold uppercase tracking-wider text-xs transition-colors rounded-(--radius)"
                >
                    Enviar
                </button>
            </form>
        </div>
    )
}

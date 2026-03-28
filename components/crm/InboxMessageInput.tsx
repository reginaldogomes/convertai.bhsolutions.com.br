'use client'

import { useActionState, useEffect, useRef } from 'react'
import { sendMessage } from '@/actions/messages'
import { toast } from 'sonner'

const initialState = { error: '', success: false }

export function InboxMessageInput({ contactId }: { contactId: string }) {
    const [state, action] = useActionState(sendMessage, initialState)
    const formRef = useRef<HTMLFormElement>(null)

    useEffect(() => {
        if (state?.success) {
            formRef.current?.reset()
        } else if (state?.error) {
            toast.error(state.error)
        }
    }, [state])

    return (
        <div className="p-5 border-t border-border bg-card shrink-0">
            <form ref={formRef} action={action} className="flex gap-3">
                <input type="hidden" name="contact_id" value={contactId} />
                <input type="hidden" name="channel" value="whatsapp" />
                <input
                    name="content"
                    type="text"
                    required
                    placeholder="Digite uma mensagem..."
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

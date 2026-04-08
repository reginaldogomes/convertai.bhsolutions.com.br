'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createCampaign } from '@/actions/campaigns'
import { toast } from 'sonner'
import { Plus, Mail, MessageSquare, MessageCircle } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { InlineError } from '@/components/ui/inline-error'

const initialState = { error: '', success: false }

const CHANNELS = [
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'sms', label: 'SMS', icon: MessageSquare },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
] as const

type Channel = typeof CHANNELS[number]['value']

export function CreateCampaignButton() {
    const [open, setOpen] = useState(false)
    const [channel, setChannel] = useState<Channel>('email')
    const [state, action] = useActionState(createCampaign, initialState)
    const router = useRouter()

    useEffect(() => {
        if (state?.success) {
            toast.success('Campanha criada com sucesso!')
            queueMicrotask(() => {
                setOpen(false)
                setChannel('email')
                router.refresh()
            })
        } else if (state?.error) {
            toast.error(state.error)
        }
    }, [state, router])

    const isEmail = channel === 'email'

    return (
        <>
            <Button
                type="button"
                size="sm"
                onClick={() => setOpen(true)}
                className="h-8 px-4 text-xs font-bold uppercase tracking-wider"
            >
                <Plus className="w-3.5 h-3.5" />
                Nova Campanha
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-[hsl(var(--background-tertiary))] border-border rounded-(--radius) sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-foreground text-lg font-black tracking-tight">Nova Campanha</DialogTitle>
                    </DialogHeader>
                    <form action={action} className="space-y-4 py-4">
                        <input type="hidden" name="channel" value={channel} />

                        <div className="space-y-1.5">
                            <Label className="text-foreground-secondary text-xs uppercase tracking-wider">Canal</Label>
                            <div className="flex gap-2">
                                {CHANNELS.map(ch => {
                                    const Icon = ch.icon
                                    return (
                                        <Button
                                            key={ch.value}
                                            type="button"
                                            onClick={() => setChannel(ch.value)}
                                            size="sm"
                                            variant={channel === ch.value ? 'default' : 'secondary'}
                                            className="h-8 px-3 text-xs font-bold uppercase tracking-wider"
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {ch.label}
                                        </Button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-foreground-secondary text-xs uppercase tracking-wider">Nome da Campanha</Label>
                            <Input
                                required
                                id="name"
                                name="name"
                                placeholder="Ex: Newsletter Março 2026"
                                className="bg-secondary border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary"
                            />
                        </div>

                        {isEmail && (
                            <div className="space-y-1.5">
                                <Label htmlFor="subject" className="text-foreground-secondary text-xs uppercase tracking-wider">Assunto do Email</Label>
                                <Input
                                    id="subject"
                                    name="subject"
                                    placeholder="Ex: Novidades que vão transformar seu negócio"
                                    className="bg-secondary border-border text-foreground rounded-(--radius) h-9 text-sm focus:border-primary"
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="body" className="text-foreground-secondary text-xs uppercase tracking-wider">
                                {isEmail ? 'Conteúdo (HTML)' : 'Mensagem'}
                            </Label>
                            <Textarea
                                id="body"
                                name="body"
                                rows={6}
                                placeholder={isEmail
                                    ? "<h1>Olá {{nome}}</h1>\n<p>Seu conteúdo aqui...</p>"
                                    : "Olá {{nome}}, confira nossas novidades!"
                                }
                                className={`bg-secondary border-border text-foreground rounded-(--radius) text-sm focus:border-primary resize-none ${isEmail ? 'font-mono text-xs' : 'text-sm'}`}
                            />
                            <p className="text-muted-foreground text-[10px]">
                                Use {"{{nome}}"} e {"{{email}}"} para personalização.{isEmail && ' HTML é suportado.'}
                                {!isEmail && ' Limite de 160 caracteres para SMS.'}
                            </p>
                        </div>

                        {state?.error && (
                            <InlineError message={state.error} size="sm" />
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                className="h-9"
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" className="h-9 text-xs font-bold uppercase tracking-wider">
                                Criar Campanha
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

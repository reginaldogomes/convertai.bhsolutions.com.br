'use client'

import { useState } from 'react'
import { sendCampaign } from '@/actions/campaigns'
import { toast } from 'sonner'
import { Send, Loader2, X } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

interface SendCampaignButtonProps {
    campaignId: string
    campaignName: string
    recipientCount: number
    channel?: string
    disabled?: boolean
}

export function SendCampaignButton({ campaignId, campaignName, recipientCount, channel = 'email', disabled }: SendCampaignButtonProps) {
    const [open, setOpen] = useState(false)
    const [sending, setSending] = useState(false)
    const [tagInput, setTagInput] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const router = useRouter()

    const channelLabel: Record<string, string> = {
        email: 'email',
        whatsapp: 'WhatsApp',
        sms: 'SMS',
    }

    const addTag = (value: string) => {
        const trimmed = value.trim()
        if (trimmed && !tags.includes(trimmed)) {
            setTags(prev => [...prev, trimmed])
        }
        setTagInput('')
    }

    const removeTag = (tag: string) => {
        setTags(prev => prev.filter(t => t !== tag))
    }

    const handleSend = async () => {
        setSending(true)
        const result = await sendCampaign(campaignId, tags.length > 0 ? tags : undefined)
        setSending(false)
        setOpen(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`Campanha enviada! ${result.sent} mensagens enviadas.`)
            router.refresh()
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                disabled={disabled}
                className="bg-primary hover:bg-[hsl(var(--primary-hover))] disabled:opacity-40 disabled:cursor-not-allowed text-white h-9 px-6 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors rounded-(--radius)"
            >
                <Send className="w-3.5 h-3.5" />
                Enviar Campanha
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-[hsl(var(--background-tertiary))] border-border rounded-(--radius) sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-foreground text-lg font-black tracking-tight">Confirmar Envio</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="bg-secondary border border-border p-4 space-y-2 rounded-(--radius)">
                            <p className="text-foreground text-sm font-bold">{campaignName}</p>
                            <p className="text-foreground-secondary text-xs">
                                Canal: <span className="text-primary font-bold capitalize">{channelLabel[channel] ?? channel}</span>
                                {tags.length === 0 && (
                                    <> · Será enviada para <span className="text-primary font-bold">{recipientCount}</span> contatos com {channel === 'email' ? 'email' : 'telefone'} cadastrado.</>
                                )}
                                {tags.length > 0 && (
                                    <> · Filtrado pelas tags selecionadas abaixo.</>
                                )}
                            </p>
                        </div>

                        {/* Filtro por tags */}
                        <div className="space-y-2">
                            <p className="text-foreground-secondary text-xs uppercase tracking-wider font-bold">
                                Filtrar por tags <span className="text-muted-foreground font-normal normal-case">(opcional)</span>
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' || e.key === ',') {
                                            e.preventDefault()
                                            addTag(tagInput)
                                        }
                                    }}
                                    placeholder="Digite uma tag e pressione Enter"
                                    className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9 text-xs"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addTag(tagInput)}
                                    className="h-9 text-xs"
                                    disabled={!tagInput.trim()}
                                >
                                    Adicionar
                                </Button>
                            </div>
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1">
                                            {tag}
                                            <button
                                                onClick={() => removeTag(tag)}
                                                className="hover:text-destructive transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-[hsl(var(--warning))]/5 border border-[hsl(var(--warning))]/20 p-3 rounded-(--radius)">
                            <p className="text-[hsl(var(--warning))] text-xs font-bold uppercase tracking-wider mb-1">Atenção</p>
                            <p className="text-[hsl(var(--warning))]/80 text-xs">
                                Esta ação não pode ser desfeita. As mensagens serão enviadas imediatamente.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                disabled={sending}
                                className="text-foreground-secondary rounded-(--radius) h-9"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSend}
                                disabled={sending}
                                className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white rounded-(--radius) h-9 font-bold uppercase tracking-wider text-xs flex items-center gap-2"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-3.5 h-3.5" />
                                        Confirmar Envio
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

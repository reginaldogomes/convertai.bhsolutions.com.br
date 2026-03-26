'use client'

import { useState } from 'react'
import { sendCampaign } from '@/actions/campaigns'
import { toast } from 'sonner'
import { Send, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface SendCampaignButtonProps {
    campaignId: string
    campaignName: string
    recipientCount: number
    disabled?: boolean
}

export function SendCampaignButton({ campaignId, campaignName, recipientCount, disabled }: SendCampaignButtonProps) {
    const [open, setOpen] = useState(false)
    const [sending, setSending] = useState(false)
    const router = useRouter()

    const handleSend = async () => {
        setSending(true)
        const result = await sendCampaign(campaignId)
        setSending(false)
        setOpen(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`Campanha enviada! ${result.sent} emails enviados.`)
            router.refresh()
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                disabled={disabled}
                className="bg-primary hover:bg-[hsl(var(--primary-hover))] disabled:opacity-40 disabled:cursor-not-allowed text-white h-9 px-6 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors rounded-[var(--radius)]"
            >
                <Send className="w-3.5 h-3.5" />
                Enviar Campanha
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-[hsl(var(--background-tertiary))] border-border rounded-[var(--radius)] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-foreground text-lg font-black tracking-tight">Confirmar Envio</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="bg-secondary border border-border p-4 space-y-2 rounded-[var(--radius)]">
                            <p className="text-foreground text-sm font-bold">{campaignName}</p>
                            <p className="text-foreground-secondary text-xs">
                                Será enviada para <span className="text-primary font-bold">{recipientCount}</span> contatos com email cadastrado.
                            </p>
                        </div>

                        <div className="bg-[hsl(var(--warning))]/5 border border-[hsl(var(--warning))]/20 p-3 rounded-[var(--radius)]">
                            <p className="text-[hsl(var(--warning))] text-xs font-bold uppercase tracking-wider mb-1">Atenção</p>
                            <p className="text-[hsl(var(--warning))]/80 text-xs">
                                Esta ação não pode ser desfeita. Os emails serão enviados imediatamente.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                disabled={sending}
                                className="text-foreground-secondary rounded-[var(--radius)] h-9"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSend}
                                disabled={sending}
                                className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white rounded-[var(--radius)] h-9 font-bold uppercase tracking-wider text-xs flex items-center gap-2"
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

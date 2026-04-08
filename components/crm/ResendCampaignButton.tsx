'use client'

import { useState } from 'react'
import { resendCampaign } from '@/actions/campaigns'
import { toast } from 'sonner'
import { RefreshCw, Loader2, AlertTriangle } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { InlineNotice } from '@/components/ui/inline-notice'
import { useRouter } from 'next/navigation'

interface ResendCampaignButtonProps {
    campaignId: string
    campaignName: string
    recipientCount: number
    failedCount: number
}

export function ResendCampaignButton({ campaignId, campaignName, recipientCount, failedCount }: ResendCampaignButtonProps) {
    const [open, setOpen] = useState(false)
    const [sending, setSending] = useState(false)
    const router = useRouter()

    const handleResend = async () => {
        setSending(true)
        const result = await resendCampaign(campaignId)
        setSending(false)
        setOpen(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`Campanha reenviada! ${result.sent} emails enviados, ${result.failed} falharam.`)
            router.refresh()
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="bg-[hsl(var(--primary-subtle))] hover:bg-[hsl(var(--primary-soft))] border-2 border-primary hover:border-primary text-primary h-9 px-6 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors rounded-(--radius)"
            >
                <RefreshCw className="w-3.5 h-3.5" />
                Reenviar Campanha
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-[hsl(var(--background-tertiary))] border-border rounded-(--radius) sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-foreground text-lg font-black tracking-tight">Reenviar Campanha</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="bg-secondary border border-border p-4 space-y-2 rounded-(--radius)">
                            <p className="text-foreground text-sm font-bold">{campaignName}</p>
                            <p className="text-foreground-secondary text-xs">
                                Será reenviada para <span className="text-primary font-bold">{recipientCount}</span> contatos com email cadastrado.
                            </p>
                        </div>

                        {failedCount > 0 && (
                            <InlineNotice
                                variant="destructive"
                                title="Falhas no envio anterior"
                                size="sm"
                                message={`${failedCount} emails falharam no envio anterior. O reenvio tentará enviar novamente para todos os contatos.`}
                            />
                        )}

                        <InlineNotice
                            variant="warning"
                            title="Atenção"
                            size="sm"
                            message="Contatos que já receberam o email anteriormente receberão novamente. Use com cuidado."
                        />

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
                                onClick={handleResend}
                                disabled={sending}
                                className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white rounded-(--radius) h-9 font-bold uppercase tracking-wider text-xs flex items-center gap-2"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Reenviando...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Confirmar Reenvio
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

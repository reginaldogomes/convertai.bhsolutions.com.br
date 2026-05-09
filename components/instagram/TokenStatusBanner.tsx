'use client'

import { useState } from 'react'
import { AlertTriangle, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { refreshInstagramToken } from '@/actions/instagram'
import { toast } from 'sonner'

interface Props {
    tokenExpiresAt: string
}

function getDaysUntilExpiry(expiresAt: string): number {
    return Math.floor((new Date(expiresAt).getTime() - Date.now()) / 86_400_000)
}

export function TokenStatusBanner({ tokenExpiresAt }: Props) {
    const [loading, setLoading] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const daysLeft = getDaysUntilExpiry(tokenExpiresAt)

    // Only show if expiring within 15 days or already expired
    if (daysLeft > 15 || dismissed) return null

    const isExpired = daysLeft <= 0

    async function handleRefresh() {
        setLoading(true)
        try {
            const result = await refreshInstagramToken()
            if (result.success) {
                toast.success('Token renovado com sucesso! Válido por mais 60 dias.')
                setDismissed(true)
            } else {
                toast.error(result.error || 'Falha ao renovar token.')
            }
        } finally {
            setLoading(false)
        }
    }

    if (isExpired) {
        return (
            <div className="flex items-center gap-3 px-4 py-3 rounded-(--radius) border border-destructive/40 bg-destructive/10 text-destructive text-sm">
                <XCircle className="w-4 h-4 shrink-0" />
                <p className="flex-1 font-medium">
                    Token do Instagram <strong>expirado</strong>. Publicações estão desabilitadas.
                </p>
                <Button size="sm" variant="destructive" onClick={handleRefresh} disabled={loading}>
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Renovar agora'}
                </Button>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-3 px-4 py-3 rounded-(--radius) border border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.08)] text-[hsl(var(--warning))] text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <p className="flex-1">
                Seu token do Instagram expira em <strong>{daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}</strong>.
                Renove agora para evitar interrupção nas publicações.
            </p>
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    className="bg-[hsl(var(--warning))] text-white hover:bg-[hsl(var(--warning)/0.9)]"
                    onClick={handleRefresh}
                    disabled={loading}
                >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Renovar'}
                </Button>
                <button
                    onClick={() => setDismissed(true)}
                    className="text-[hsl(var(--warning)/0.7)] hover:text-[hsl(var(--warning))] transition-colors text-xs underline"
                >
                    Lembrar depois
                </button>
            </div>
        </div>
    )
}

export function TokenOkBadge({ tokenExpiresAt }: Props) {
    const daysLeft = getDaysUntilExpiry(tokenExpiresAt)
    if (daysLeft <= 15) return null
    return (
        <span className="flex items-center gap-1 text-[10px] text-[hsl(var(--success))] font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Token válido · {daysLeft}d
        </span>
    )
}

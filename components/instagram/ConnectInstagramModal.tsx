'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
    Instagram,
    ExternalLink,
    Shield,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Loader2,
    Unplug,
} from 'lucide-react'

const SETUP_STEPS = [
    'Ter uma conta Business ou Creator no Instagram',
    'Uma Página do Facebook vinculada à conta Instagram',
    'App configurado no Meta Developer Dashboard com o produto "Facebook Login"',
    'Redirect URI cadastrada nas configurações do app',
]

interface ConnectInstagramModalProps {
    isConnected?: boolean
    username?: string
}

export function ConnectInstagramModal({ isConnected, username }: ConnectInstagramModalProps) {
    const [open, setOpen] = useState(false)
    const [connecting, setConnecting] = useState(false)
    const [error, setError] = useState('')

    const clientId = process.env.NEXT_PUBLIC_META_APP_ID
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const redirectUri = `${appUrl}/api/instagram/callback`

    // Facebook Login flow — uses Facebook App ID + Graph API scopes
    const scope = [
        'pages_show_list',
        'pages_read_engagement',
        'instagram_basic',
        'instagram_content_publish',
        'instagram_manage_insights',
        'business_management',
    ].join(',')

    const authUrl = [
        'https://www.facebook.com/v21.0/dialog/oauth?',
        `client_id=${clientId}`,
        `&redirect_uri=${encodeURIComponent(redirectUri)}`,
        `&scope=${scope}`,
        '&response_type=code',
        '&auth_type=rerequest',
    ].join('')

    // Check for callback errors in URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const errParam = params.get('error')
        const connected = params.get('connected')

        if (errParam) {
            const messages: Record<string, string> = {
                token_exchange_failed: 'Falha ao trocar o código por token. Verifique as credenciais do app.',
                long_token_failed: 'Falha ao obter token de longo prazo.',
                no_ig_account: 'Nenhuma conta Instagram Business encontrada. Vincule sua conta Instagram a uma Página do Facebook.',
                no_pages: 'Nenhuma Página do Facebook encontrada. Crie uma página e vincule ao Instagram.',
                user_denied: 'Você negou as permissões. Tente conectar novamente e aceite as permissões solicitadas.',
                unknown: 'Erro desconhecido. Tente novamente.',
            }
            queueMicrotask(() => {
                setError(messages[errParam] || messages.unknown)
                setOpen(true)
            })
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname)
        }
        if (connected === 'true') {
            window.history.replaceState({}, '', window.location.pathname)
        }
    }, [])

    const handleConnect = () => {
        if (!clientId) {
            setError('NEXT_PUBLIC_META_APP_ID não configurado no .env.local')
            return
        }
        setConnecting(true)
        setError('')
        window.location.href = authUrl
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isConnected ? (
                    <button className="h-8 px-3 border border-border bg-card text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors inline-flex items-center gap-1.5 rounded-(--radius)">
                        <Instagram className="w-3.5 h-3.5" />
                        Gerenciar
                    </button>
                ) : (
                    <div className="border border-dashed border-border p-5 flex items-center gap-4 bg-secondary/50 rounded-(--radius) cursor-pointer hover:border-primary/50 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-[hsl(var(--primary-subtle))] flex items-center justify-center shrink-0">
                            <Instagram className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-sm text-foreground">Conecte sua conta do Instagram</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Conecte com o Facebook Login para publicar, agendar e acompanhar métricas.
                            </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                )}
            </DialogTrigger>

            <DialogContent className="max-w-lg p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-foreground font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-primary" />
                        {isConnected ? 'Conta Conectada' : 'Conectar Instagram'}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-5">
                    {/* Connected State */}
                    {isConnected && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 border border-[hsl(var(--success))] bg-[hsl(var(--success-subtle))] rounded-(--radius)">
                                <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success))] shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-foreground">@{username}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Conta conectada e ativa</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">Funcionalidades ativas:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Publicar Posts', 'Publicar Reels', 'Publicar Stories', 'Ver Métricas'].map(f => (
                                        <div key={f} className="flex items-center gap-1.5 text-xs text-foreground">
                                            <CheckCircle2 className="w-3 h-3 text-[hsl(var(--success))]" />
                                            {f}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleConnect}
                                className="w-full h-9 border border-border bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors inline-flex items-center justify-center gap-1.5 rounded-(--radius)"
                            >
                                <Unplug className="w-3.5 h-3.5" />
                                Reconectar conta
                            </button>
                        </div>
                    )}

                    {/* Not Connected State */}
                    {!isConnected && (
                        <div className="space-y-5">
                            {/* Error */}
                            {error && (
                                <div className="flex items-start gap-2.5 p-3 border border-[hsl(var(--destructive))] bg-[hsl(var(--destructive-subtle))] rounded-(--radius)">
                                    <AlertCircle className="w-4 h-4 text-[hsl(var(--destructive))] shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-[hsl(var(--destructive))]">Erro na conexão</p>
                                        <p className="text-[11px] text-[hsl(var(--destructive))] mt-0.5">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* How it works */}
                            <div className="space-y-2.5">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Como funciona</p>
                                <div className="space-y-2">
                                    {[
                                        { step: '1', text: 'Clique em "Conectar com Facebook" abaixo' },
                                        { step: '2', text: 'Faça login e autorize as permissões' },
                                        { step: '3', text: 'Selecione a Página do Facebook vinculada ao Instagram' },
                                        { step: '4', text: 'Pronto! Sua conta será conectada automaticamente' },
                                    ].map(s => (
                                        <div key={s.step} className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                                {s.step}
                                            </span>
                                            <span className="text-xs text-foreground">{s.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Requirements */}
                            <div className="space-y-2.5">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Pré-requisitos</p>
                                <div className="p-3 border border-border bg-muted space-y-2 rounded-(--radius)">
                                    {SETUP_STEPS.map((step, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <Shield className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                                            <span className="text-[11px] text-muted-foreground">{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Permissions being requested */}
                            <div className="space-y-2.5">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Permissões solicitadas</p>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {[
                                        { perm: 'pages_show_list', desc: 'Listar suas páginas' },
                                        { perm: 'instagram_basic', desc: 'Dados básicos do perfil' },
                                        { perm: 'instagram_content_publish', desc: 'Publicar conteúdo' },
                                        { perm: 'instagram_manage_insights', desc: 'Métricas e insights' },
                                    ].map(p => (
                                        <div key={p.perm} className="p-2 border border-border bg-muted/50 rounded-(--radius)">
                                            <p className="text-[9px] font-mono-data text-muted-foreground">{p.perm}</p>
                                            <p className="text-[10px] text-foreground mt-0.5">{p.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Connect Button */}
                            <button
                                type="button"
                                onClick={handleConnect}
                                disabled={connecting}
                                className="w-full h-11 bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2 rounded-(--radius)"
                            >
                                {connecting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Redirecionando...
                                    </>
                                ) : (
                                    <>
                                        <ExternalLink className="w-4 h-4" />
                                        Conectar com Facebook
                                    </>
                                )}
                            </button>

                            <p className="text-[10px] text-muted-foreground text-center">
                                O login é feito via Facebook porque a API do Instagram Business requer uma Página do Facebook vinculada.
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

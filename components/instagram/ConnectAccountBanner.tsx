'use client'

import { Instagram, ExternalLink } from 'lucide-react'

export function ConnectAccountBanner() {
    const clientId = process.env.NEXT_PUBLIC_META_APP_ID
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const redirectUri = `${appUrl}/api/instagram/callback`
    const scope = 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_comments'
    const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&enable_fb_login=0&force_authentication=1`

    return (
        <div className="border border-dashed border-border p-5 flex items-center gap-4 bg-secondary/50 rounded-(--radius)">
            <div className="w-12 h-12 rounded-full bg-[hsl(var(--primary-subtle))] flex items-center justify-center shrink-0">
                <Instagram className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-sm text-foreground">Conecte sua conta do Instagram</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Conecte com a API do Meta Business para publicar diretamente, agendar posts e acompanhar métricas.
                </p>
            </div>
            <a
                href={authUrl}
                className="h-8 px-4 bg-primary hover:bg-[hsl(var(--primary-hover))] text-white text-xs font-bold uppercase tracking-wider rounded-(--radius) transition-colors inline-flex items-center gap-1.5"
            >
                <ExternalLink className="w-3.5 h-3.5" />
                Conectar
            </a>
        </div>
    )
}

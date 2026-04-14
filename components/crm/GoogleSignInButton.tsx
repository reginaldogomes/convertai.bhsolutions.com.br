'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getGoogleOAuthUrl } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface Props {
    disabled?: boolean
    onError?: (message: string) => void
}

const OAUTH_ERRORS: Record<string, string> = {
    oauth: 'Ocorreu um erro ao autenticar com o Google.',
    missing_code: 'Autenticação incompleta. Tente novamente.',
    auth_failed: 'Não foi possível verificar sua identidade. Tente novamente.',
    provisioning_failed: 'Sua conta foi autenticada, mas houve um erro ao configurar o perfil. Entre em contato com o suporte.',
}

export function GoogleSignInButton({ disabled, onError }: Props) {
    const router = useRouter()
    const [pending, setPending] = useState(false)
    const popupRef = useRef<Window | null>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        function handleMessage(event: MessageEvent) {
            if (event.origin !== window.location.origin) return
            const data = event.data as { type?: string; error?: string }
            if (data?.type !== 'oauth-success' && data?.type !== 'oauth-error') return

            clearPoll()
            setPending(false)

            if (data.type === 'oauth-error') {
                const msg = OAUTH_ERRORS[data.error ?? ''] ?? OAUTH_ERRORS.oauth
                onError?.(msg)
            } else {
                router.refresh()
                router.push('/')
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [router, onError])

    function clearPoll() {
        if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
        }
    }

    async function handleClick() {
        if (pending) return
        setPending(true)
        onError?.('')

        const { url, error } = await getGoogleOAuthUrl()

        if (error || !url) {
            setPending(false)
            onError?.(OAUTH_ERRORS.oauth)
            return
        }

        const width = 500
        const height = 640
        const left = Math.round(window.screenX + (window.outerWidth - width) / 2)
        const top = Math.round(window.screenY + (window.outerHeight - height) / 2)

        const popup = window.open(
            url,
            'google-auth',
            `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`,
        )

        if (!popup) {
            // Popup bloqueado — fallback para redirecionamento direto
            setPending(false)
            window.location.href = url
            return
        }

        popupRef.current = popup

        // Detecta fechamento manual do popup
        pollRef.current = setInterval(() => {
            if (popup.closed) {
                clearPoll()
                setPending(false)
            }
        }, 500)
    }

    return (
        <Button
            type="button"
            variant="outline"
            disabled={disabled || pending}
            onClick={handleClick}
            className="w-full h-10 font-semibold text-sm gap-3 border-border hover:bg-secondary"
        >
            {pending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <GoogleIcon />
            )}
            Continuar com Google
        </Button>
    )
}

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
        </svg>
    )
}

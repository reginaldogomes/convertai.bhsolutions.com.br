'use client'

import { useActionState, useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { login, getGoogleOAuthUrl } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { BRAND } from '@/lib/brand'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'

const initialState = { error: '' }

const OAUTH_ERRORS: Record<string, string> = {
    oauth: 'Ocorreu um erro ao autenticar com o Google.',
    missing_code: 'Autenticação incompleta. Tente novamente.',
    auth_failed: 'Não foi possível verificar sua identidade. Tente novamente.',
    provisioning_failed: 'Sua conta foi autenticada, mas houve um erro ao configurar o perfil. Entre em contato com o suporte.',
}

export default function LoginPage() {
    const [state, action, pending] = useActionState(login, initialState)
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState('')
    const [emailTouched, setEmailTouched] = useState(false)
    const [googlePending, setGooglePending] = useState(false)
    const [googleError, setGoogleError] = useState<string | null>(null)
    const popupRef = useRef<Window | null>(null)
    const router = useRouter()

    const searchParams = useSearchParams()
    const oauthError = searchParams.get('error')
    const oauthErrorMessage = googleError ??
        (oauthError ? (OAUTH_ERRORS[oauthError] ?? OAUTH_ERRORS.oauth) : null)

    const emailInvalid = emailTouched && email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return
            if (event.data?.type === 'oauth-success') {
                popupRef.current?.close()
                router.push('/')
            } else if (event.data?.type === 'oauth-error') {
                popupRef.current?.close()
                setGooglePending(false)
                setGoogleError(OAUTH_ERRORS[event.data.error] ?? OAUTH_ERRORS.oauth)
            }
        }
        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [router])

    const handleGoogleLogin = async () => {
        setGoogleError(null)
        setGooglePending(true)
        const { url, error } = await getGoogleOAuthUrl()
        if (!url || error) {
            setGoogleError(OAUTH_ERRORS.oauth)
            setGooglePending(false)
            return
        }
        const width = 500
        const height = 620
        const left = Math.round(window.screenX + (window.outerWidth - width) / 2)
        const top = Math.round(window.screenY + (window.outerHeight - height) / 2)
        const popup = window.open(url, 'google-oauth', `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`)
        if (!popup) {
            // Popup bloqueado — redirecionar na aba atual
            window.location.href = url
            return
        }
        popupRef.current = popup
        // Detectar fechamento manual do popup
        const timer = setInterval(() => {
            if (popup.closed) {
                clearInterval(timer)
                setGooglePending(false)
            }
        }, 500)
    }

    return (
        <div className="space-y-8">
            <div className="space-y-1">
                <div className="flex items-center gap-2 mb-6 lg:hidden">
                    <div className="w-7 h-7 bg-primary flex items-center justify-center rounded-(--radius)">
                        <span className="text-primary-foreground font-black text-xs">{BRAND.abbr}</span>
                    </div>
                    <span className="text-foreground font-bold">{BRAND.name}</span>
                </div>
                <h2 className="text-foreground text-2xl font-black tracking-tight">Entrar</h2>
                <p className="text-muted-foreground text-sm">Acesse sua conta para continuar</p>
            </div>

            {/* Erro de OAuth (vindo de ?error=...) */}
            {oauthErrorMessage && (
                <div role="alert" className="flex items-start gap-2 text-destructive text-xs border border-destructive/20 bg-destructive/5 px-3 py-2.5 rounded-(--radius)">
                    <span className="shrink-0 mt-0.5">⚠</span>
                    <span>{oauthErrorMessage}</span>
                </div>
            )}

            {/* Botão Google */}
            <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={googlePending || pending}
                className="w-full h-10 font-semibold text-sm gap-3 border-border hover:bg-secondary"
            >
                {googlePending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <GoogleIcon />
                )}
                Continuar com Google
            </Button>

            {/* Divisor */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-muted-foreground text-xs uppercase tracking-wider">ou</span>
                <div className="flex-1 h-px bg-border" />
            </div>

            {/* Formulário email/senha */}
            <form action={action} className="space-y-4" noValidate>
                {/* Email */}
                <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-foreground-secondary text-xs uppercase tracking-wider">
                        Email
                    </Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="voce@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setEmailTouched(true)}
                        aria-invalid={emailInvalid}
                        aria-describedby={emailInvalid ? 'email-error' : undefined}
                        className={[
                            'bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary h-10 text-sm',
                            emailInvalid ? 'border-destructive focus:border-destructive' : '',
                        ].join(' ')}
                    />
                    {emailInvalid && (
                        <p id="email-error" className="text-destructive text-xs">
                            Informe um email válido.
                        </p>
                    )}
                </div>

                {/* Senha */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-foreground-secondary text-xs uppercase tracking-wider">
                            Senha
                        </Label>
                        <Link
                            href="/forgot-password"
                            className="text-primary text-xs hover:text-[hsl(var(--primary-hover))] transition-colors"
                            tabIndex={-1}
                        >
                            Esqueceu a senha?
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            required
                            minLength={6}
                            placeholder="••••••••"
                            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary h-10 text-sm pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Erro do servidor */}
                {state?.error && (
                    <div role="alert" className="flex items-start gap-2 text-destructive text-xs border border-destructive/20 bg-destructive/5 px-3 py-2.5 rounded-(--radius)">
                        <span className="shrink-0 mt-0.5">⚠</span>
                        <span>{state.error}</span>
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={pending || googlePending}
                    className="w-full h-10 font-bold uppercase tracking-wider text-xs gap-2"
                >
                    {pending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Entrando...
                        </>
                    ) : (
                        <>
                            <LogIn className="w-4 h-4" />
                            Entrar
                        </>
                    )}
                </Button>
            </form>

            <p className="text-muted-foreground text-xs text-center">
                Não tem conta?{' '}
                <Link href="/register" className="text-primary hover:text-[hsl(var(--primary-hover))] transition-colors font-medium">
                    Criar conta grátis
                </Link>
            </p>
        </div>
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

'use client'

import { useActionState } from 'react'
import { login } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

const initialState = { error: '' }

export default function LoginPage() {
    const [state, action] = useActionState(login, initialState)

    return (
        <div className="space-y-8">
            <div className="space-y-1">
                <div className="flex items-center gap-2 mb-6 lg:hidden">
                    <div className="w-7 h-7 bg-primary flex items-center justify-center rounded-[var(--radius)]">
                        <span className="text-primary-foreground font-black text-xs">AG</span>
                    </div>
                    <span className="text-foreground font-bold">Antigravity</span>
                </div>
                <h2 className="text-foreground text-2xl font-black tracking-tight">Entrar</h2>
                <p className="text-muted-foreground text-sm">Acesse sua conta</p>
            </div>

            <form action={action} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-foreground-secondary text-xs uppercase tracking-wider">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="voce@empresa.com"
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary h-10 text-sm"
                    />
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-foreground-secondary text-xs uppercase tracking-wider">Senha</Label>
                        <Link href="/forgot-password" className="text-primary text-xs hover:text-[hsl(var(--primary-hover))] transition-colors">
                            Esqueceu?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary h-10 text-sm"
                    />
                </div>

                {state?.error && (
                    <p className="text-destructive text-xs border border-destructive/20 bg-destructive/5 px-3 py-2 rounded-[var(--radius)]">
                        {state.error}
                    </p>
                )}

                <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-[hsl(var(--primary-hover))] text-primary-foreground h-10 font-bold uppercase tracking-wider text-xs transition-colors"
                >
                    Entrar
                </Button>
            </form>

            <p className="text-muted-foreground text-xs text-center">
                Não tem conta?{' '}
                <Link href="/register" className="text-primary hover:text-[hsl(var(--primary-hover))] transition-colors">
                    Criar conta
                </Link>
            </p>
        </div>
    )
}

'use client'

import { useActionState } from 'react'
import { forgotPassword } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

const initialState = { error: '', success: false }

export default function ForgotPasswordPage() {
    const [state, action] = useActionState(forgotPassword, initialState)

    if (state?.success) {
        return (
            <div className="space-y-4">
                <div className="border border-primary/30 bg-primary/10 px-4 py-3 rounded-[var(--radius)]">
                    <p className="text-primary text-sm font-medium">Email enviado</p>
                    <p className="text-muted-foreground text-xs mt-1">Verifique sua caixa de entrada.</p>
                </div>
                <Link href="/login" className="block text-center text-muted-foreground text-xs hover:text-foreground transition-colors">
                    ← Voltar ao login
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="space-y-1">
                <h2 className="text-foreground text-2xl font-black tracking-tight">Recuperar Senha</h2>
                <p className="text-muted-foreground text-sm">Enviaremos um link de recuperação</p>
            </div>

            <form action={action} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-foreground-secondary text-xs uppercase tracking-wider">Email</Label>
                    <Input id="email" name="email" type="email" required placeholder="voce@empresa.com"
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary h-10 text-sm" />
                </div>

                {state?.error && (
                    <p className="text-destructive text-xs border border-destructive/20 bg-destructive/5 px-3 py-2 rounded-[var(--radius)]">{state.error}</p>
                )}

                <Button type="submit"
                    className="w-full bg-primary hover:bg-[hsl(var(--primary-hover))] text-primary-foreground h-10 font-bold uppercase tracking-wider text-xs">
                    Enviar Link
                </Button>
            </form>

            <Link href="/login" className="block text-center text-muted-foreground text-xs hover:text-foreground transition-colors">
                ← Voltar ao login
            </Link>
        </div>
    )
}

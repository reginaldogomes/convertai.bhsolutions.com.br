'use client'

import { useActionState } from 'react'
import { register } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { BRAND } from '@/lib/brand'

const initialState = { error: '' }

export default function RegisterPage() {
    const [state, action] = useActionState(register, initialState)

    return (
        <div className="space-y-8">
            <div className="space-y-1">
                <div className="flex items-center gap-2 mb-6 lg:hidden">
                    <div className="w-7 h-7 bg-primary flex items-center justify-center rounded-(--radius)">
                        <span className="text-primary-foreground font-black text-xs">{BRAND.abbr}</span>
                    </div>
                    <span className="text-foreground font-bold">{BRAND.name}</span>
                </div>
                <h2 className="text-foreground text-2xl font-black tracking-tight">Criar conta</h2>
                <p className="text-muted-foreground text-sm">Comece a usar a plataforma</p>
            </div>

            <form action={action} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-foreground-secondary text-xs uppercase tracking-wider">Seu Nome</Label>
                    <Input id="name" name="name" required placeholder="João Silva"
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary h-10 text-sm" />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="orgName" className="text-foreground-secondary text-xs uppercase tracking-wider">Nome da Empresa</Label>
                    <Input id="orgName" name="orgName" required placeholder="Minha Empresa"
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary h-10 text-sm" />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-foreground-secondary text-xs uppercase tracking-wider">Email</Label>
                    <Input id="email" name="email" type="email" required placeholder="voce@empresa.com"
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary h-10 text-sm" />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-foreground-secondary text-xs uppercase tracking-wider">Senha</Label>
                    <Input id="password" name="password" type="password" required placeholder="••••••••"
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary h-10 text-sm" />
                </div>

                {state?.error && (
                    <p className="text-destructive text-xs border border-destructive/20 bg-destructive/5 px-3 py-2 rounded-(--radius)">{state.error}</p>
                )}

                <Button type="submit"
                    className="w-full bg-primary hover:bg-[hsl(var(--primary-hover))] text-primary-foreground h-10 font-bold uppercase tracking-wider text-xs">
                    Criar Conta
                </Button>
            </form>

            <p className="text-muted-foreground text-xs text-center">
                Já tem conta?{' '}
                <Link href="/login" className="text-primary hover:text-[hsl(var(--primary-hover))] transition-colors">Entrar</Link>
            </p>
        </div>
    )
}

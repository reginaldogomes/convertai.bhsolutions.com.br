'use client'

import { useActionState } from 'react'
import { UserCog, Loader2 } from 'lucide-react'
import { promoteToSuperAdmin } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InlineNotice } from '@/components/ui/inline-notice'

export function PromoteSuperAdminForm() {
    const [state, action, pending] = useActionState(promoteToSuperAdmin, { error: '', success: false })
    const inputCls = 'bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9'

    return (
        <form action={action} className="space-y-4">
            {state.success && (
                <InlineNotice variant="success" message="Usuário promovido a super admin com sucesso." size="sm" />
            )}
            {state.error && (
                <InlineNotice variant="destructive" message={state.error} size="sm" />
            )}

            <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                    <Label className="text-foreground-secondary text-xs uppercase tracking-wider">E-mail do usuário</Label>
                    <Input
                        name="email"
                        type="email"
                        placeholder="usuario@exemplo.com"
                        required
                        autoComplete="off"
                        className={inputCls}
                    />
                </div>
                <Button
                    type="submit"
                    disabled={pending}
                    className="h-9 px-5 text-xs font-bold uppercase tracking-wider gap-2 shrink-0"
                >
                    {pending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <UserCog className="w-4 h-4" />
                    )}
                    {pending ? 'Promovendo...' : 'Promover'}
                </Button>
            </div>
            <p className="text-muted-foreground text-xs">
                O usuário deve já ter uma conta cadastrada na plataforma. A sessão dele precisará ser renovada para que as permissões sejam aplicadas.
            </p>
        </form>
    )
}

'use client'

import { useActionState, useState } from 'react'
import { adminUpdateUserRole, adminRemoveUser } from '@/actions/members'
import { Button } from '@/components/ui/button'
import { Loader2, UserMinus } from 'lucide-react'

const ROLES = [
    { value: 'owner',  label: 'Proprietário' },
    { value: 'admin',  label: 'Administrador' },
    { value: 'agent',  label: 'Agente' },
    { value: 'viewer', label: 'Visualizador' },
]

interface Props {
    userId: string
    orgId: string
    currentRole: string
}

export function AdminUserActions({ userId, orgId, currentRole }: Props) {
    const [roleState, roleAction, rolePending] = useActionState(adminUpdateUserRole, { error: '', success: false })
    const [removeState, removeAction, removePending] = useActionState(adminRemoveUser, { error: '', success: false })
    const [confirm, setConfirm] = useState(false)

    return (
        <div className="flex items-center justify-end gap-2">
            {/* Role changer */}
            <form action={roleAction} className="inline-flex items-center gap-1">
                <input type="hidden" name="userId" value={userId} />
                <input type="hidden" name="orgId" value={orgId} />
                <select
                    name="role"
                    defaultValue={currentRole}
                    disabled={rolePending}
                    onChange={e => {
                        const form = e.target.closest('form') as HTMLFormElement | null
                        form?.requestSubmit()
                    }}
                    className="h-7 text-xs border border-border rounded-(--radius) bg-background text-foreground px-2"
                >
                    {ROLES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                </select>
                {rolePending && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                {roleState.error && <span className="text-xs text-destructive ml-1">{roleState.error}</span>}
            </form>

            {/* Remove */}
            {confirm ? (
                <div className="flex items-center gap-1">
                    <form action={removeAction}>
                        <input type="hidden" name="userId" value={userId} />
                        <input type="hidden" name="orgId" value={orgId} />
                        <Button
                            type="submit"
                            variant="destructive"
                            size="sm"
                            disabled={removePending}
                            className="h-7 px-2 text-xs font-bold gap-1"
                        >
                            {removePending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmar'}
                        </Button>
                    </form>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirm(false)}
                        className="h-7 px-2 text-xs"
                    >
                        Cancelar
                    </Button>
                </div>
            ) : (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirm(true)}
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive gap-1"
                >
                    <UserMinus className="w-3.5 h-3.5" />
                </Button>
            )}
            {removeState.error && <span className="text-xs text-destructive">{removeState.error}</span>}
        </div>
    )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Check, ChevronDown, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { switchOrganization, createOrganization } from '@/actions/organization'
import { useActionState } from 'react'

interface OrgEntry {
    orgId: string
    orgName: string
    role: string
}

interface OrgSwitcherProps {
    organizations: OrgEntry[]
    activeOrgId: string
    activeOrgName: string
}

const initialCreateState = { error: '', success: false }

export function OrgSwitcher({ organizations, activeOrgId, activeOrgName }: OrgSwitcherProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [showCreate, setShowCreate] = useState(false)
    const [switching, startSwitch] = useTransition()
    const [createState, createAction, creating] = useActionState(createOrganization, initialCreateState)

    function handleSwitch(orgId: string) {
        if (orgId === activeOrgId) { setOpen(false); return }
        startSwitch(async () => {
            const result = await switchOrganization(orgId)
            if (!result.error) {
                setOpen(false)
                router.refresh()
            }
        })
    }

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-(--radius) hover:bg-white/8 transition-colors group"
            >
                <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="flex-1 text-left text-xs font-medium text-white/70 truncate group-hover:text-white">
                    {activeOrgName}
                </span>
                <ChevronDown className={cn(
                    'w-3.5 h-3.5 text-white/30 shrink-0 transition-transform',
                    open && 'rotate-180'
                )} />
            </button>

            {open && (
                <div className="absolute left-0 right-0 mt-1 z-50 bg-[hsl(var(--sidebar-bg))] border border-[hsl(var(--sidebar-border))] rounded-(--radius) shadow-xl overflow-hidden">
                    {/* Org list */}
                    <div className="py-1 max-h-48 overflow-y-auto">
                        {organizations.map(org => (
                            <button
                                key={org.orgId}
                                onClick={() => handleSwitch(org.orgId)}
                                disabled={switching}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/8 transition-colors disabled:opacity-50"
                            >
                                {switching ? (
                                    <Loader2 className="w-3.5 h-3.5 text-white/30 animate-spin shrink-0" />
                                ) : (
                                    <Check className={cn(
                                        'w-3.5 h-3.5 shrink-0',
                                        org.orgId === activeOrgId ? 'text-primary' : 'text-transparent'
                                    )} />
                                )}
                                <span className={cn(
                                    'flex-1 text-left truncate',
                                    org.orgId === activeOrgId ? 'text-white font-medium' : 'text-white/60'
                                )}>
                                    {org.orgName}
                                </span>
                                <span className="text-[10px] text-white/30 capitalize shrink-0">{org.role}</span>
                            </button>
                        ))}
                    </div>

                    <div className="border-t border-[hsl(var(--sidebar-border))]">
                        {!showCreate ? (
                            <button
                                onClick={() => setShowCreate(true)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-white hover:bg-white/8 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Nova organização
                            </button>
                        ) : (
                            <form action={createAction} className="p-2 space-y-2">
                                <input
                                    name="name"
                                    autoFocus
                                    placeholder="Nome da organização"
                                    className="w-full text-xs bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
                                    required
                                    minLength={2}
                                    maxLength={100}
                                />
                                {createState.error && (
                                    <p className="text-[10px] text-red-400">{createState.error}</p>
                                )}
                                <div className="flex gap-1">
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="flex-1 text-[10px] font-bold uppercase bg-primary text-white rounded px-2 py-1 hover:bg-primary/80 disabled:opacity-50 transition-colors"
                                    >
                                        {creating ? 'Criando...' : 'Criar'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreate(false)}
                                        className="text-[10px] text-white/40 hover:text-white px-2 py-1 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

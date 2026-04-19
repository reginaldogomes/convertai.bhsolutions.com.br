'use client'

import { useEffect, useRef } from 'react'
import { useActionState } from 'react'
import { addCustomDomain, deleteCustomDomain, checkDomainStatus } from '@/actions/domains'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InlineNotice } from '@/components/ui/inline-notice'
import { Globe, Link, Trash2, CheckCircle, Clock, AlertTriangle, Loader, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type LandingPageSelect = {
    id: string
    name: string
}

type Domain = {
    id: string
    domain: string
    status: 'pending' | 'active' | 'error'
    createdAt: string
    verifiedAt: string | null
    target: {
        id: string | null
        name: string
        slug: string
    } | null
}

interface CustomDomainsSettingsProps {
    domains: Domain[]
    pages: LandingPageSelect[]
}

const initialState = { error: '', success: false, message: '' }

const deleteInitialState = { error: undefined, success: false, message: '' }

function DeleteDomainForm({ domainId }: { domainId: string }) {
    const [state, action, pending] = useActionState(deleteCustomDomain, deleteInitialState)
    
    return (
        <form action={action}>
            <input type="hidden" name="domainId" value={domainId} />
            <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                disabled={pending}
                aria-label="Remover domínio"
            >
                {pending ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
        </form>
    )
}

const verifyInitialState = { error: undefined, message: undefined, success: false }

function VerifyDomainForm({ domain }: { domain: string }) {
    const [state, action, pending] = useActionState(checkDomainStatus, verifyInitialState);

    // Opcional: Exibir uma notificação (toast) ao concluir a verificação.
    useEffect(() => {
        if (state?.message) {
            // Ex: toast.info(state.message)
            console.info('Verificação de domínio:', state.message)
        }
        if (state?.error) {
            // Ex: toast.error(state.error)
            console.error('Erro na verificação:', state.error)
        }
    }, [state]);

    return (
        <form action={action}>
            <input type="hidden" name="domain" value={domain} />
            <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                disabled={pending}
                aria-label="Verificar status do domínio"
            >
                {pending ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
        </form>
    );
}

export function CustomDomainsSettings({ domains, pages }: CustomDomainsSettingsProps) {
    const [state, action, pending] = useActionState(addCustomDomain, initialState)
    const formRef = useRef<HTMLFormElement>(null)

    useEffect(() => {
        if (state.success) {
            formRef.current?.reset()
        }
    }, [state.success])

    const getStatusInfo = (status: Domain['status']) => {
        switch (status) {
            case 'active':
                return { Icon: CheckCircle, color: 'text-[hsl(var(--success))]', label: 'Ativo' }
            case 'pending':
                return { Icon: Clock, color: 'text-yellow-500', label: 'Pendente' }
            case 'error':
                return { Icon: AlertTriangle, color: 'text-destructive', label: 'Erro' }
            default:
                return { Icon: Clock, color: 'text-muted-foreground', label: 'Desconhecido' }
        }
    }

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-medium text-foreground">Domínios Personalizados</h3>
                <p className="text-sm text-muted-foreground">
                    Conecte seus próprios domínios para usar em suas landing pages.
                </p>
            </div>

            <div className="border border-border rounded-(--radius) bg-card">
                <form action={action} ref={formRef}>
                    <div className="p-6 space-y-4">
                        <h4 className="font-semibold text-foreground">Adicionar novo domínio</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="domain" className="text-foreground-secondary text-xs uppercase tracking-wider">
                                    Domínio ou Subdomínio
                                </Label>
                                <Input
                                    id="domain"
                                    name="domain"
                                    placeholder="ex: ofertas.suaempresa.com.br"
                                    className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="targetPageId" className="text-foreground-secondary text-xs uppercase tracking-wider">
                                    Apontar para a Landing Page
                                </Label>
                                <Select name="targetPageId">
                                    <SelectTrigger className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9">
                                        <SelectValue placeholder="Selecione uma página" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pages.map(page => (
                                            <SelectItem key={page.id} value={page.id}>{page.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {state.error && <InlineNotice variant="destructive" message={state.error} size="sm" />}
                        {state.success && state.message && <InlineNotice variant="success" message={state.message} size="sm" />}
                    </div>
                    <div className="px-6 py-4 bg-[hsl(var(--background-tertiary))] border-t border-border flex justify-end rounded-b-(--radius)">
                        <Button type="submit" className="h-9 px-5 text-xs font-bold uppercase tracking-wider gap-2" disabled={pending}>
                            {pending ? <Loader className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                            Adicionar Domínio
                        </Button>
                    </div>
                </form>
            </div>

            <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Domínios Conectados</h4>
                {domains.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum domínio personalizado adicionado ainda.</p>
                ) : (
                    <div className="border border-border rounded-(--radius) bg-card">
                        <ul className="divide-y divide-border">
                            {domains.map(domain => {
                                const StatusIcon = getStatusInfo(domain.status).Icon
                                const statusColor = getStatusInfo(domain.status).color
                                const statusLabel = getStatusInfo(domain.status).label

                                return (
                                    <li key={domain.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                                        <div className="flex items-center gap-4">
                                            <StatusIcon className={`w-5 h-5 ${statusColor} shrink-0`} />
                                            <div className="flex-grow">
                                                <p className="font-semibold text-foreground">{domain.domain}</p>
                                                <div className="text-sm text-muted-foreground flex items-center gap-4">
                                                    <span>
                                                        Adicionado {' '}
                                                        {formatDistanceToNow(new Date(domain.createdAt), { addSuffix: true, locale: ptBR })}
                                                    </span>
                                                    {domain.target && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Link className="w-3 h-3" />
                                                            <span>{domain.target.name}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                <span className={`w-2 h-2 rounded-full ${domain.status === 'active' ? 'bg-[hsl(var(--success))]' : domain.status === 'pending' ? 'bg-yellow-500' : 'bg-destructive'}`} />
                                                {statusLabel}
                                            </div>
                                            {domain.status !== 'active' && <VerifyDomainForm domain={domain.domain} />}
                                            <DeleteDomainForm domainId={domain.id} />
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}
                <InlineNotice variant="info" size="sm" className="mt-4">
                    A verificação de um novo domínio pode levar de alguns minutos a 48 horas, dependendo da propagação do seu DNS.
                </InlineNotice>
            </div>
        </div>
    )
}
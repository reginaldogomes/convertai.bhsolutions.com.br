import { redirect } from 'next/navigation'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import dynamic from 'next/dynamic'
import { SendCampaignButton } from '@/components/crm/SendCampaignButton'
import { ResendCampaignButton } from '@/components/crm/ResendCampaignButton'
import { Mail, ArrowLeft, MessageSquare, Phone, CheckCheck, Clock, XCircle, BookOpen, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const CampaignEditor = dynamic(() => import('@/components/crm/CampaignEditor').then(m => m.CampaignEditor), {
    loading: () => <div className="h-96 animate-pulse bg-secondary rounded-(--radius)" />,
})

const HtmlPreview = dynamic(() => import('@/components/crm/HtmlPreview').then(m => m.HtmlPreview), {
    loading: () => <div className="h-48 animate-pulse bg-secondary rounded-(--radius)" />,
})

const WhatsAppMessagePreview = dynamic(
    () => import('@/components/crm/WhatsAppMessagePreview').then(m => m.WhatsAppMessagePreview),
    { loading: () => <div className="h-48 animate-pulse bg-secondary rounded-(--radius)" /> },
)

const channelIcons = { email: Mail, sms: Phone, whatsapp: MessageSquare } as const
const channelLabels = { email: 'Email', sms: 'SMS', whatsapp: 'WhatsApp' } as const

interface CampaignDetailPageProps {
    params: Promise<{ id: string }>
}

const recipientStatusConfig = {
    pending:   { label: 'Pendente',   color: 'bg-secondary text-muted-foreground border-border',                         icon: Clock },
    sent:      { label: 'Enviado',    color: 'bg-primary/10 text-primary border-primary/20',                             icon: CheckCheck },
    delivered: { label: 'Entregue',   color: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20', icon: CheckCheck },
    read:      { label: 'Lido',       color: 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-[hsl(var(--success))]/30', icon: BookOpen },
    failed:    { label: 'Falhou',     color: 'bg-destructive/10 text-destructive border-destructive/20',                  icon: XCircle },
} as const

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
    const { id } = await params
    const { orgId } = await getAuthContext()

    const result = await useCases.getCampaign().execute(orgId, id)
    if (!result.ok) redirect('/campaigns')

    const campaign = result.value
    const channel = (campaign.channel || 'email') as 'email' | 'sms' | 'whatsapp'
    const isTextChannel = channel === 'sms' || channel === 'whatsapp'
    const ChannelIcon = channelIcons[channel] ?? Mail
    const channelLabel = channelLabels[channel] ?? 'Email'

    const [recipients, recipientsResult] = await Promise.all([
        useCases.listRecipients().execute(orgId),
        campaign.isSent() ? useCases.getCampaignRecipients().execute(orgId, id) : Promise.resolve([]),
    ])

    const deliveredCount = recipientsResult.filter(r => r.status === 'delivered' || r.status === 'read').length
    const readCount = recipientsResult.filter(r => r.status === 'read').length
    const failedCount = recipientsResult.filter(r => r.status === 'failed').length
    const sentCount = recipientsResult.length

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-6">
                <div className="space-y-1">
                    <Link
                        href="/campaigns"
                        className="text-muted-foreground text-xs uppercase tracking-[0.2em] font-medium mb-1 flex items-center gap-1.5 hover:text-foreground-secondary transition-colors"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Campanhas
                    </Link>
                    <h1 className="text-foreground text-2xl font-black tracking-tight flex items-center gap-3">
                        <ChannelIcon className="w-6 h-6 text-primary" />
                        {campaign.name}
                    </h1>
                    <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider border rounded-(--radius) ${campaign.isSent() ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20' : 'bg-secondary text-foreground-secondary border-border'}`}>
                            {campaign.status}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-secondary text-foreground-secondary border border-border rounded-(--radius)">
                            {channelLabel}
                        </span>
                        <span className="text-muted-foreground text-xs">
                            {recipients.length} contatos
                        </span>
                    </div>
                </div>

                {campaign.isDraft() && (
                    <SendCampaignButton
                        campaignId={campaign.id}
                        campaignName={campaign.name}
                        recipientCount={recipients.length}
                        channel={channel}
                        disabled={!campaign.canSend()}
                    />
                )}

                {campaign.isSent() && (
                    <ResendCampaignButton
                        campaignId={campaign.id}
                        campaignName={campaign.name}
                        recipientCount={recipients.length}
                        failedCount={campaign.metrics.total_failed}
                    />
                )}
            </div>

            {/* Draft: editor */}
            {campaign.isDraft() && (
                <div className="bg-card border border-border p-6 rounded-(--radius)">
                    <CampaignEditor
                        campaignId={campaign.id}
                        name={campaign.name}
                        subject={campaign.subject}
                        body={campaign.body}
                        channel={campaign.channel}
                    />
                </div>
            )}

            {/* Sent: metrics + content + recipients */}
            {campaign.isSent() && (
                <>
                    {/* Metrics */}
                    {isTextChannel ? (
                        /* WhatsApp / SMS metrics */
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <MetricCard label="Total Enviados" value={sentCount} />
                            <MetricCard label="Entregues" value={deliveredCount} variant="success" />
                            <MetricCard label="Lidos" value={readCount} variant="success" />
                            <MetricCard label="Falharam" value={failedCount} variant={failedCount > 0 ? 'danger' : 'default'} />
                        </div>
                    ) : (
                        /* Email metrics */
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <MetricCard label="Enviados" value={campaign.metrics.total_sent} />
                            <MetricCard label="Falharam" value={campaign.metrics.total_failed} variant={campaign.metrics.total_failed > 0 ? 'danger' : 'default'} />
                            <MetricCard label="Taxa de Abertura" value={`${campaign.metrics.open_rate}%`} />
                            <MetricCard label="Taxa de Cliques" value={`${campaign.metrics.click_rate}%`} />
                            <MetricCard label="Taxa de Bounce" value={`${campaign.metrics.bounce_rate}%`} variant={campaign.metrics.bounce_rate > 5 ? 'danger' : 'default'} />
                        </div>
                    )}

                    {/* Sent info + content */}
                    <div className="bg-card border border-border p-6 space-y-4 rounded-(--radius)">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {!isTextChannel && (
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Assunto</p>
                                    <p className="text-foreground text-sm font-bold">{campaign.subject}</p>
                                </div>
                            )}
                            <div className="space-y-1">
                                <p className="text-muted-foreground text-xs uppercase tracking-wider">Enviada em</p>
                                <p className="text-foreground text-sm font-bold">
                                    {campaign.sentAt ? new Date(campaign.sentAt).toLocaleString('pt-BR') : '—'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-muted-foreground text-xs uppercase tracking-wider">Conteúdo</p>
                            {channel === 'whatsapp' ? (
                                <WhatsAppMessagePreview body={campaign.body} standalone />
                            ) : isTextChannel ? (
                                <div className="bg-secondary border border-border rounded-(--radius) p-4">
                                    <p className="text-foreground text-sm font-mono whitespace-pre-wrap">{campaign.body}</p>
                                </div>
                            ) : (
                                <HtmlPreview html={campaign.body} />
                            )}
                        </div>
                    </div>

                    {/* Recipients table (WhatsApp/SMS or when tracking data exists) */}
                    {(isTextChannel || recipientsResult.length > 0) && recipientsResult.length > 0 && (
                        <div className="bg-card border border-border rounded-(--radius) overflow-hidden">
                            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                                <h2 className="text-foreground text-sm font-bold uppercase tracking-wider">
                                    Destinatários <span className="text-muted-foreground font-normal normal-case">({recipientsResult.length})</span>
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left px-6 py-3 text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Contato</th>
                                            <th className="text-left px-6 py-3 text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Destinatário</th>
                                            <th className="text-left px-6 py-3 text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Status</th>
                                            <th className="text-left px-6 py-3 text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Enviado em</th>
                                            <th className="text-left px-6 py-3 text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Entregue em</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recipientsResult.map((r) => {
                                            const statusKey = (r.status ?? 'pending') as keyof typeof recipientStatusConfig
                                            const cfg = recipientStatusConfig[statusKey] ?? recipientStatusConfig.pending
                                            const Icon = cfg.icon
                                            return (
                                                <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                                                    <td className="px-6 py-3 text-foreground font-medium text-sm">{r.contactName ?? '—'}</td>
                                                    <td className="px-6 py-3 text-muted-foreground text-xs font-mono">{r.recipientAddress}</td>
                                                    <td className="px-6 py-3">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-(--radius) ${cfg.color}`}>
                                                            <Icon className="w-3 h-3" />
                                                            {cfg.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-muted-foreground text-xs">
                                                        {r.sentAt ? new Date(r.sentAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                                                    </td>
                                                    <td className="px-6 py-3 text-muted-foreground text-xs">
                                                        {r.deliveredAt ? new Date(r.deliveredAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : r.status === 'failed' ? (
                                                            <span className="flex items-center gap-1 text-destructive text-[10px]">
                                                                <AlertCircle className="w-3 h-3" />
                                                                {r.errorMessage ?? 'Erro'}
                                                            </span>
                                                        ) : '—'}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

function MetricCard({ label, value, variant = 'default' }: { label: string; value: string | number; variant?: 'default' | 'danger' | 'success' }) {
    const valueClass = variant === 'danger' ? 'text-destructive' : variant === 'success' ? 'text-[hsl(var(--success))]' : 'text-foreground'
    return (
        <div className="bg-card border border-border p-4 rounded-(--radius)">
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-xl font-black tracking-tight ${valueClass}`}>
                {value}
            </p>
        </div>
    )
}

import { redirect } from 'next/navigation'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import dynamic from 'next/dynamic'
import { SendCampaignButton } from '@/components/crm/SendCampaignButton'
import { ResendCampaignButton } from '@/components/crm/ResendCampaignButton'
import { Mail, ArrowLeft, CheckCircle2, XCircle, MessageSquare, Phone } from 'lucide-react'
import Link from 'next/link'

const CampaignEditor = dynamic(() => import('@/components/crm/CampaignEditor').then(m => m.CampaignEditor), {
    loading: () => <div className="h-96 animate-pulse bg-secondary rounded-(--radius)" />,
})

const HtmlPreview = dynamic(() => import('@/components/crm/HtmlPreview').then(m => m.HtmlPreview), {
    loading: () => <div className="h-48 animate-pulse bg-secondary rounded-(--radius)" />,
})

const channelIcons = { email: Mail, sms: Phone, whatsapp: MessageSquare } as const
const channelLabels = { email: 'Email', sms: 'SMS', whatsapp: 'WhatsApp' } as const

interface CampaignDetailPageProps {
    params: Promise<{ id: string }>
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
    const { id } = await params
    const { orgId } = await getAuthContext()

    const result = await useCases.getCampaign().execute(orgId, id)
    if (!result.ok) redirect('/campaigns')

    const campaign = result.value
    const channel = campaign.channel || 'email'
    const ChannelIcon = channelIcons[channel as keyof typeof channelIcons] || Mail
    const channelLabel = channelLabels[channel as keyof typeof channelLabels] || 'Email'
    const recipients = await useCases.listRecipients().execute(orgId)

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

            {/* Sent: metrics + readonly */}
            {campaign.isSent() && (
                <>
                    {/* Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <MetricCard label="Enviados" value={campaign.metrics.total_sent} />
                        <MetricCard label="Falharam" value={campaign.metrics.total_failed} variant="danger" />
                        <MetricCard label="Taxa de Abertura" value={`${campaign.metrics.open_rate}%`} />
                        <MetricCard label="Taxa de Cliques" value={`${campaign.metrics.click_rate}%`} />
                        <MetricCard label="Taxa de Bounce" value={`${campaign.metrics.bounce_rate}%`} variant={campaign.metrics.bounce_rate > 5 ? 'danger' : 'default'} />
                    </div>

                    {/* Sent info */}
                    <div className="bg-card border border-border p-6 space-y-4 rounded-(--radius)">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-muted-foreground text-xs uppercase tracking-wider">Assunto</p>
                                <p className="text-foreground text-sm font-bold">{campaign.subject}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-muted-foreground text-xs uppercase tracking-wider">Enviada em</p>
                                <p className="text-foreground text-sm font-bold">
                                    {campaign.sentAt ? new Date(campaign.sentAt).toLocaleString() : '—'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-muted-foreground text-xs uppercase tracking-wider">Conteúdo</p>
                            <HtmlPreview html={campaign.body} />
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

function MetricCard({ label, value, variant = 'default' }: { label: string; value: string | number; variant?: 'default' | 'danger' }) {
    return (
        <div className="bg-card border border-border p-4 rounded-(--radius)">
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-xl font-black tracking-tight ${variant === 'danger' ? 'text-destructive' : 'text-foreground'}`}>
                {value}
            </p>
        </div>
    )
}

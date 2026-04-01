import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { Campaign } from '@/domain/entities'
import { CreateCampaignButton } from '@/components/crm/CreateCampaignButton'
import { PageHeader } from '@/components/layout/PageHeader'
import { Mail, MessageSquare, Phone, Megaphone } from 'lucide-react'
import Link from 'next/link'

const channelLabels: Record<string, string> = { email: 'Email', sms: 'SMS', whatsapp: 'WhatsApp' }
const channelColors: Record<string, string> = {
    email: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    sms: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    whatsapp: 'bg-green-500/10 text-green-500 border-green-500/20',
}

export default async function CampaignsPage() {
    const auth = await tryGetAuthContext()
    const rows = auth
        ? await useCases.listCampaigns().execute(auth.orgId)
        : []
    const campaigns = rows.map(Campaign.fromRow)

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                category="Marketing"
                title="Campanhas"
                icon={Megaphone}
                actions={<CreateCampaignButton />}
            />

            {/* List */}
            <div className="bg-card border border-border rounded-(--radius)">
                {campaigns.length === 0 && (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <Mail className="w-8 h-8 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-sm">Nenhuma campanha criada.</p>
                    </div>
                )}

                <div className="divide-y divide-border-subtle">
                    {campaigns.map((campaign) => (
                        <div key={campaign.id} className="p-5 flex items-center justify-between hover:bg-accent transition-colors">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <Link href={`/campaigns/${campaign.id}`} className="text-foreground font-bold hover:text-primary transition-colors">
                                        {campaign.name}
                                    </Link>
                                    <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider border rounded-(--radius) ${campaign.isSent() ? 'bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))] border-[hsl(var(--success))]' : 'bg-secondary text-foreground-secondary border-border'}`}>
                                        {campaign.status}
                                    </span>
                                    <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider border rounded-(--radius) ${channelColors[campaign.channel] || channelColors.email}`}>
                                        {channelLabels[campaign.channel] || 'Email'}
                                    </span>
                                </div>
                                <p className="text-muted-foreground text-sm">{campaign.subject || 'Sem assunto'}</p>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="flex gap-6">
                                    <div>
                                        <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">Abertura</p>
                                        <p className="text-foreground-secondary text-sm font-mono-data">{campaign.metrics.open_rate}%</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">Cliques</p>
                                        <p className="text-foreground-secondary text-sm font-mono-data">{campaign.metrics.click_rate}%</p>
                                    </div>
                                </div>

                                {campaign.isSent() ? (
                                    <span className="text-muted-foreground text-xs font-mono-data px-4 border-l border-border">
                                        Enviada em {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString() : '—'}
                                    </span>
                                ) : (
                                    <Link
                                        href={`/campaigns/${campaign.id}`}
                                        className="h-8 px-4 border-2 border-primary bg-[hsl(var(--primary-subtle))] hover:bg-[hsl(var(--primary-soft))] text-primary text-xs uppercase tracking-wider font-bold transition-colors inline-flex items-center rounded-(--radius)"
                                    >
                                        Editar
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

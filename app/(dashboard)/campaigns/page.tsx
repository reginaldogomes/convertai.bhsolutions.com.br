import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { Campaign } from '@/domain/entities'
import { CreateCampaignButton } from '@/components/crm/CreateCampaignButton'
import { PageHeader } from '@/components/layout/PageHeader'
import { Mail } from 'lucide-react'
import Link from 'next/link'

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
                title="Campanhas de Email"
                icon={Mail}
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
                        <div key={campaign.id} className="p-5 flex items-center justify-between hover:bg-secondary/70 transition-colors">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <Link href={`/campaigns/${campaign.id}`} className="text-foreground font-bold hover:text-primary transition-colors">
                                        {campaign.name}
                                    </Link>
                                    <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider border rounded-(--radius) ${campaign.isSent() ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20' : 'bg-secondary text-foreground-secondary border-border'}`}>
                                        {campaign.status}
                                    </span>
                                </div>
                                <p className="text-muted-foreground text-sm">{campaign.subject || 'Sem assunto'}</p>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="flex gap-6">
                                    <div>
                                        <p className="text-muted-foreground/60 text-[10px] uppercase tracking-wider mb-0.5">Abertura</p>
                                        <p className="text-foreground-secondary text-sm font-mono-data">{campaign.metrics.open_rate}%</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground/60 text-[10px] uppercase tracking-wider mb-0.5">Cliques</p>
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
                                        className="h-8 px-4 border-2 border-primary/60 bg-primary/20 hover:bg-primary/30 text-primary text-xs uppercase tracking-wider font-bold transition-colors inline-flex items-center rounded-(--radius)"
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

import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { PageHeader } from '@/components/layout/PageHeader'
import { TrendingUp } from 'lucide-react'
import dynamic from 'next/dynamic'

const PipelineBoard = dynamic(() => import('@/components/crm/PipelineBoard').then(m => m.PipelineBoard), {
    loading: () => <div className="h-150 animate-pulse bg-secondary rounded-(--radius)" />,
})

export default async function DealsPipelinePage() {
    const auth = await tryGetAuthContext()

    const [deals, contacts] = auth
        ? await Promise.all([
            useCases.listDeals().execute(auth.orgId),
            useCases.listContactSelects().execute(auth.orgId),
        ])
        : [[], []]

    return (
        <div className="p-8 h-full flex flex-col min-h-0">
            <PageHeader category="CRM" title="Pipeline (Deals)" icon={TrendingUp} />

            {/* Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden -mx-8 px-8">
                <PipelineBoard initialDeals={deals.map(d => ({
                    id: d.id,
                    title: d.title,
                    pipeline_stage: d.pipelineStage,
                    value: d.value,
                    contacts: d.contactName ? { name: d.contactName, company: d.contactCompany } : null,
                }))} contacts={contacts} />
            </div>
        </div>
    )
}

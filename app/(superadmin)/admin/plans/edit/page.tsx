import { getPlanById } from '@/actions/saas'
import { PageHeader } from '@/components/layout/PageHeader'
import { CreditCard } from 'lucide-react'
import { PlanForm } from './PlanForm'

interface EditPlanPageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function EditPlanPage({ searchParams }: EditPlanPageProps) {
  const params = await searchParams
  const plan = params.id ? await getPlanById(params.id) : null

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        category="Super Admin / Planos"
        title={plan ? `Editar Plano: ${plan.name}` : 'Criar Novo Plano'}
        icon={CreditCard}
      />
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-(--radius) p-6">
          <PlanForm plan={plan} />
        </div>
      </div>
    </div>
  )
}

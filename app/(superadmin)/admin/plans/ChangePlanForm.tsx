'use client'

import { useActionState } from 'react'
import { adminChangePlan } from '@/actions/saas'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { Plan } from '@/domain/entities'
import type { PlanId } from '@/types/database'

interface ChangePlanFormProps {
    orgId: string
    currentPlanId: PlanId
    plans: Plan[]
}

export function ChangePlanForm({ orgId, currentPlanId, plans }: ChangePlanFormProps) {
    const [state, action, pending] = useActionState(adminChangePlan, { error: '', success: false })

    return (
        <form action={action} className="flex items-center gap-2">
            <input type="hidden" name="orgId" value={orgId} />
            <select
                name="planId"
                defaultValue={currentPlanId}
                className="h-7 rounded-(--radius) border border-border bg-[hsl(var(--background-tertiary))] px-2 text-xs text-foreground"
            >
                {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
            </select>
            <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={pending}
                className="h-7 px-2 text-xs font-bold uppercase tracking-wider"
                title={state.error || undefined}
            >
                {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Trocar'}
            </Button>
        </form>
    )
}

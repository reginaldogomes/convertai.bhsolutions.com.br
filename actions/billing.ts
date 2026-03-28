'use server'

import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import type { OrgLimitsAndUsage } from '@/domain/interfaces/plan-repository'

export async function getMyUsageAndLimits(): Promise<OrgLimitsAndUsage> {
    const { orgId } = await getAuthContext()
    return useCases.getOrgLimitsAndUsage().execute(orgId)
}

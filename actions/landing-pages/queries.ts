'use server'

import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from '../utils'

export async function getLandingPagesForSelect() {
    try {
        const { orgId } = await getAuthContext()
        const pages = await useCases.listLandingPages().execute(orgId)

        return { pages: pages.map(p => ({ id: p.id, name: p.name })), error: null }
    } catch (error) {
        return { pages: [], error: getErrorMessage(error) }
    }
}

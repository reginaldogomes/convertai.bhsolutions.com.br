'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { userRepo } from '@/application/services/container'
import { getErrorMessage } from './utils'

export async function updateOrganization(
    _prevState: { error: string; success: boolean },
    formData: FormData
) {
    try {
        const { orgId } = await getAuthContext()

        await userRepo.updateOrganization(orgId, {
            orgName: (formData.get('name') as string) || undefined,
            orgEmail: formData.get('email') as string | null,
            orgPhone: formData.get('phone') as string | null,
            orgWebsite: formData.get('website') as string | null,
            orgAddress: formData.get('address') as string | null,
            orgCity: formData.get('city') as string | null,
            orgState: formData.get('state') as string | null,
            orgZipCode: formData.get('zipCode') as string | null,
            orgCountry: formData.get('country') as string | null,
            orgDescription: formData.get('description') as string | null,
        })

        revalidatePath('/settings')
        return { error: '', success: true }
    } catch (err) {
        return { error: getErrorMessage(err), success: false }
    }
}

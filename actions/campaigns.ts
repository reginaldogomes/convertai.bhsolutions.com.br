'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from './utils'

export async function createCampaign(prevState: { error: string; success: boolean }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()

        const result = await useCases.createCampaign().execute(orgId, {
            name: formData.get('name') as string,
            subject: (formData.get('subject') ?? undefined) as string | undefined,
            body: (formData.get('body') ?? undefined) as string | undefined,
            channel: (formData.get('channel') ?? undefined) as string | undefined,
        })

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/campaigns')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function updateCampaign(prevState: { error: string; success: boolean }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()
        const campaignId = formData.get('campaign_id') as string

        const result = await useCases.updateCampaign().execute(orgId, campaignId, {
            name: (formData.get('name') ?? undefined) as string | undefined,
            subject: (formData.get('subject') ?? undefined) as string | undefined,
            body: (formData.get('body') ?? undefined) as string | undefined,
            channel: (formData.get('channel') ?? undefined) as string | undefined,
        })

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/campaigns')
        revalidatePath(`/campaigns/${campaignId}`)
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function sendCampaign(campaignId: string, tags?: string[]) {
    try {
        const { orgId } = await getAuthContext()

        const result = await useCases.sendCampaign().execute(orgId, campaignId, { tags })

        if (!result.ok) return { error: result.error.message, sent: 0, failed: 0 }

        revalidatePath('/campaigns')
        revalidatePath(`/campaigns/${campaignId}`)
        return { error: '', ...result.value }
    } catch (error) {
        return { error: getErrorMessage(error), sent: 0, failed: 0 }
    }
}

export async function resendCampaign(campaignId: string, tags?: string[]) {
    try {
        const { orgId } = await getAuthContext()

        const result = await useCases.sendCampaign().execute(orgId, campaignId, { resend: true, tags })

        if (!result.ok) return { error: result.error.message, sent: 0, failed: 0 }

        revalidatePath('/campaigns')
        revalidatePath(`/campaigns/${campaignId}`)
        return { error: '', ...result.value }
    } catch (error) {
        return { error: getErrorMessage(error), sent: 0, failed: 0 }
    }
}

export async function getCampaignRecipients(campaignId: string) {
    try {
        const { orgId } = await getAuthContext()
        const recipients = await useCases.getCampaignRecipients().execute(orgId, campaignId)
        return { error: '', recipients: recipients.map(r => ({
            id: r.id,
            contactName: r.contactName,
            recipientAddress: r.recipientAddress,
            status: r.status,
            sentAt: r.sentAt,
            deliveredAt: r.deliveredAt,
            readAt: r.readAt,
            errorMessage: r.errorMessage,
        }))}
    } catch (error) {
        return { error: getErrorMessage(error), recipients: [] }
    }
}

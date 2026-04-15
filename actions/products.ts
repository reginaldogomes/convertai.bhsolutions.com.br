'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from './utils'
import { canDo } from '@/lib/permissions'

export async function createProduct(prevState: { error: string; success: boolean }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()

        let featuresJson: unknown[] = []
        let benefitsJson: unknown[] = []
        let faqsJson: unknown[] = []

        try {
            const rawFeatures = formData.get('featuresJson') as string | null
            if (rawFeatures) featuresJson = JSON.parse(rawFeatures)
        } catch { /* ignore invalid JSON */ }

        try {
            const rawBenefits = formData.get('benefitsJson') as string | null
            if (rawBenefits) benefitsJson = JSON.parse(rawBenefits)
        } catch { /* ignore invalid JSON */ }

        try {
            const rawFaqs = formData.get('faqsJson') as string | null
            if (rawFaqs) faqsJson = JSON.parse(rawFaqs)
        } catch { /* ignore invalid JSON */ }

        const tagsRaw = formData.get('tags') as string | null
        const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []

        const priceRaw = formData.get('price') as string | null
        const price = priceRaw ? parseFloat(priceRaw) : null

        const result = await useCases.createProduct().execute(orgId, {
            name: formData.get('name') as string,
            slug: formData.get('slug') as string,
            type: (formData.get('type') as 'product' | 'service') || 'product',
            shortDescription: (formData.get('shortDescription') as string) || '',
            fullDescription: (formData.get('fullDescription') as string) || '',
            price: isNaN(price as number) ? null : price,
            priceType: (formData.get('priceType') as string) || null,
            currency: (formData.get('currency') as string) || 'BRL',
            targetAudience: (formData.get('targetAudience') as string) || '',
            differentials: (formData.get('differentials') as string) || '',
            tags,
            featuresJson,
            benefitsJson,
            faqsJson,
        })

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/products')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function updateProduct(productId: string, prevState: { error: string; success: boolean }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()

        const input: Record<string, unknown> = {}

        const name = formData.get('name') as string | null
        if (name) input.name = name

        const slug = formData.get('slug') as string | null
        if (slug) input.slug = slug

        const type = formData.get('type') as string | null
        if (type) input.type = type

        const shortDescription = formData.get('shortDescription') as string | null
        if (shortDescription !== null) input.shortDescription = shortDescription

        const fullDescription = formData.get('fullDescription') as string | null
        if (fullDescription !== null) input.fullDescription = fullDescription

        const priceRaw = formData.get('price') as string | null
        if (priceRaw !== null) {
            const price = parseFloat(priceRaw)
            input.price = isNaN(price) ? null : price
        }

        const priceType = formData.get('priceType') as string | null
        if (priceType !== null) input.priceType = priceType || null

        const currency = formData.get('currency') as string | null
        if (currency) input.currency = currency

        const targetAudience = formData.get('targetAudience') as string | null
        if (targetAudience !== null) input.targetAudience = targetAudience

        const differentials = formData.get('differentials') as string | null
        if (differentials !== null) input.differentials = differentials

        const tagsRaw = formData.get('tags') as string | null
        if (tagsRaw !== null) input.tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean)

        try {
            const rawFeatures = formData.get('featuresJson') as string | null
            if (rawFeatures) input.featuresJson = JSON.parse(rawFeatures)
        } catch { /* ignore */ }

        try {
            const rawBenefits = formData.get('benefitsJson') as string | null
            if (rawBenefits) input.benefitsJson = JSON.parse(rawBenefits)
        } catch { /* ignore */ }

        try {
            const rawFaqs = formData.get('faqsJson') as string | null
            if (rawFaqs) input.faqsJson = JSON.parse(rawFaqs)
        } catch { /* ignore */ }

        const result = await useCases.updateProduct().execute(orgId, productId, input)
        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/products')
        revalidatePath(`/products/${productId}`)
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function toggleProductStatus(productId: string, activate: boolean) {
    try {
        const { orgId } = await getAuthContext()
        const result = await useCases.toggleProductStatus().execute(orgId, productId, activate)
        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/products')
        revalidatePath(`/products/${productId}`)
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function deleteProduct(productId: string) {
    try {
        const { orgId, profile } = await getAuthContext()
        if (!canDo(profile.role, 'deleteProduct')) return { error: 'Sem permissão para excluir produtos.', success: false }
        const result = await useCases.deleteProduct().execute(orgId, productId)
        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/products')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

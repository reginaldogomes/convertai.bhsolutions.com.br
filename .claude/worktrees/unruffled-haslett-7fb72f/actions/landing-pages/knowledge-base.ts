'use server'

import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from '../utils'

export async function addKnowledgeBaseEntry(prevState: { error: string; success: boolean }, formData: FormData) {
    try {
        const { orgId } = await getAuthContext()

        const metadata = {
            source: 'landing_page_entry_form',
            entryType: 'general',
            updatedAt: new Date().toISOString(),
        }

        const result = await useCases.addKnowledgeBase().execute(orgId, {
            landingPageId: (formData.get('landingPageId') as string) || null,
            title: formData.get('title') as string,
            content: formData.get('content') as string,
            metadata,
        })

        if (!result.ok) return { error: result.error.message, success: false }

        revalidatePath('/landing-pages')
        return { error: '', success: true }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function syncProductKnowledgeBase(pageId: string) {
    try {
        const { orgId } = await getAuthContext()

        const pageResult = await useCases.getLandingPage().execute(orgId, pageId)
        if (!pageResult.ok) return { error: pageResult.error.message, success: false }

        const page = pageResult.value
        if (!page.productId) return { error: 'Nenhum produto vinculado', success: false }

        const productResult = await useCases.getProduct().execute(orgId, page.productId)
        if (!productResult.ok) return { error: 'Produto não encontrado', success: false }

        const product = productResult.value
        const entries: Array<{ title: string; content: string; metadata?: Record<string, unknown> }> = []

        const baseMetadata = {
            source: 'product_sync_knowledge_base',
            landingPageId: pageId,
            productId: product.id,
        }
        // Main overview
        const overview = [
            `${product.name} — ${product.isProduct() ? 'Produto Digital' : 'Serviço Digital'}`,
            '',
            product.fullDescription || product.shortDescription,
            product.targetAudience ? `\nPúblico-alvo: ${product.targetAudience}` : '',
            product.differentials ? `\nDiferenciais: ${product.differentials}` : '',
            product.price !== null ? `\nPreço: ${product.formattedPrice}` : '',
        ].filter(Boolean).join('\n')
        entries.push({ title: `Sobre: ${product.name}`, content: overview, metadata: { ...baseMetadata, entryType: 'product_overview', updatedAt: new Date().toISOString() } 
        })

        if (product.features.length > 0) {
            entries.push({
                title: `Funcionalidades: ${product.name}`,
                content: product.features.map(f => `• ${f.title}: ${f.description}`).join('\n'),
                metadata: { ...baseMetadata, entryType: 'product_features', updatedAt: new Date().toISOString() }
            })
        }
        if (product.benefits.length > 0) {
            entries.push({
                title: `Benefícios: ${product.name}`,
                content: product.benefits.map(b => `• ${b.title}: ${b.description}`).join('\n'),
                metadata: { ...baseMetadata, entryType: 'product_benefits', updatedAt: new Date().toISOString() }
            })
        }
        if (product.faqs.length > 0) {
            entries.push({
                title: `Perguntas Frequentes: ${product.name}`,
                content: product.faqs.map(f => `Pergunta: ${f.question}\nResposta: ${f.answer}`).join('\n\n'),
                metadata: { ...baseMetadata, entryType: 'product_faqs', updatedAt: new Date().toISOString() }
            })
        }

        // Index all entries in parallel
        const results = await Promise.all(
            entries.map(entry => useCases.addKnowledgeBase().execute(orgId, {
                landingPageId: pageId,
                title: entry.title,
                content: entry.content,
                metadata: entry.metadata,
            }))
        )
        const indexed = results.filter(r => r.ok).length

        revalidatePath(`/landing-pages/${pageId}`)
        return { error: '', success: true, message: `${indexed} entradas indexadas na base de conhecimento` }
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

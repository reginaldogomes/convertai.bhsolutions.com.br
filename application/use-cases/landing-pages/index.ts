import { z } from 'zod'
import { type Result, success, failure, ValidationError, EntityNotFoundError } from '@/domain/errors'
import type { ILandingPageRepository, IKnowledgeBaseRepository, IAnalyticsRepository, IRagService, IProductRepository, PageAnalyticsSummary } from '@/domain/interfaces'
import { LandingPage, KnowledgeBase, Product } from '@/domain/entities'

// --- Schemas ---

const createLandingPageSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(200),
    slug: z.string().min(1, 'Slug é obrigatório').max(100)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug deve conter apenas letras minúsculas, números e hifens'),
    productId: z.string().uuid().nullable().optional(),
    headline: z.string().max(500).default(''),
    subheadline: z.string().max(1000).default(''),
    ctaText: z.string().max(100).optional(),
    chatbotName: z.string().max(100).optional(),
    chatbotWelcomeMessage: z.string().max(500).optional(),
    chatbotSystemPrompt: z.string().max(15000).optional(),
})

const updateLandingPageSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    slug: z.string().min(1).max(100)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido').optional(),
    headline: z.string().max(500).optional(),
    subheadline: z.string().max(1000).optional(),
    ctaText: z.string().max(100).optional(),
    chatbotName: z.string().max(100).optional(),
    chatbotWelcomeMessage: z.string().max(500).optional(),
    chatbotSystemPrompt: z.string().max(15000).optional(),
    configJson: z.record(z.string(), z.unknown()).optional(),
})

// --- Create Landing Page ---

export class CreateLandingPageUseCase {
    constructor(
        private readonly landingPageRepo: ILandingPageRepository,
        private readonly productRepo?: IProductRepository,
        private readonly knowledgeBaseRepo?: IKnowledgeBaseRepository,
        private readonly ragService?: IRagService,
    ) {}

    async execute(orgId: string, input: {
        name: string
        slug: string
        productId?: string | null
        headline?: string
        subheadline?: string
        ctaText?: string
        chatbotName?: string
        chatbotWelcomeMessage?: string
        chatbotSystemPrompt?: string
        configJson?: Record<string, unknown>
    }): Promise<Result<LandingPage>> {
        const { configJson, ...rest } = input
        const parsed = createLandingPageSchema.safeParse(rest)
        if (!parsed.success) {
            return failure(new ValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos'))
        }

        // Check slug uniqueness
        const existing = await this.landingPageRepo.findBySlug(parsed.data.slug)
        if (existing) {
            return failure(new ValidationError('Slug já está em uso'))
        }

        const page = await this.landingPageRepo.create({
            organizationId: orgId,
            ...parsed.data,
            configJson,
        })

        if (!page) return failure(new ValidationError('Erro ao criar landing page'))

        // Auto-index product data into RAG knowledge base when a product is linked
        if (parsed.data.productId && this.productRepo && this.knowledgeBaseRepo && this.ragService) {
            this.autoIndexProductData(orgId, page.id, parsed.data.productId).catch(() => {
                // Non-critical: product data indexing failure shouldn't block LP creation
            })
        }

        return success(page)
    }

    private async autoIndexProductData(orgId: string, pageId: string, productId: string): Promise<void> {
        const product = await this.productRepo!.findById(productId)
        if (!product) return

        // Build knowledge base entries from different product sections
        const entries: Array<{ title: string; content: string }> = []

        // 1. Main overview
        const overview = [
            `${product.name} — ${product.isProduct() ? 'Produto Digital' : 'Serviço Digital'}`,
            '',
            product.fullDescription || product.shortDescription,
            product.targetAudience ? `\nPúblico-alvo: ${product.targetAudience}` : '',
            product.differentials ? `\nDiferenciais: ${product.differentials}` : '',
            product.price !== null ? `\nPreço: ${product.formattedPrice}` : '',
        ].filter(Boolean).join('\n')

        entries.push({ title: `Sobre: ${product.name}`, content: overview })

        // 2. Features
        if (product.features.length > 0) {
            const featuresText = product.features
                .map(f => `• ${f.title}: ${f.description}`)
                .join('\n')
            entries.push({ title: `Funcionalidades: ${product.name}`, content: featuresText })
        }

        // 3. Benefits
        if (product.benefits.length > 0) {
            const benefitsText = product.benefits
                .map(b => `• ${b.title}: ${b.description}`)
                .join('\n')
            entries.push({ title: `Benefícios: ${product.name}`, content: benefitsText })
        }

        // 4. FAQs
        if (product.faqs.length > 0) {
            const faqText = product.faqs
                .map(f => `Pergunta: ${f.question}\nResposta: ${f.answer}`)
                .join('\n\n')
            entries.push({ title: `Perguntas Frequentes: ${product.name}`, content: faqText })
        }

        // Index all entries in parallel
        await Promise.allSettled(
            entries.map(async (entry) => {
                const kb = await this.knowledgeBaseRepo!.create({
                    organizationId: orgId,
                    landingPageId: pageId,
                    title: entry.title,
                    content: entry.content,
                })
                if (kb) {
                    await this.ragService!.indexContent(kb.id, `${entry.title}\n\n${entry.content}`)
                }
            })
        )
    }
}

// --- Update Landing Page ---

export class UpdateLandingPageUseCase {
    constructor(private readonly landingPageRepo: ILandingPageRepository) {}

    async execute(orgId: string, pageId: string, input: Record<string, unknown>): Promise<Result<LandingPage>> {
        const parsed = updateLandingPageSchema.safeParse(input)
        if (!parsed.success) {
            return failure(new ValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos'))
        }

        const page = await this.landingPageRepo.update(pageId, orgId, parsed.data)
        if (!page) return failure(new EntityNotFoundError('Landing Page'))
        return success(page)
    }
}

// --- Get Landing Page Detail ---

export class GetLandingPageUseCase {
    constructor(private readonly landingPageRepo: ILandingPageRepository) {}

    async execute(orgId: string, pageId: string): Promise<Result<LandingPage>> {
        const page = await this.landingPageRepo.findById(pageId)
        if (!page || page.organizationId !== orgId) {
            return failure(new EntityNotFoundError('Landing Page'))
        }
        return success(page)
    }
}

// --- Publish / Unpublish ---

export class PublishLandingPageUseCase {
    constructor(private readonly landingPageRepo: ILandingPageRepository) {}

    async execute(orgId: string, pageId: string, publish: boolean): Promise<Result<boolean>> {
        const page = await this.landingPageRepo.findById(pageId)
        if (!page || page.organizationId !== orgId) {
            return failure(new EntityNotFoundError('Landing Page'))
        }

        const status = publish ? 'published' as const : 'draft' as const
        const ok = await this.landingPageRepo.updateStatus(pageId, orgId, status)
        if (!ok) return failure(new ValidationError('Erro ao atualizar status'))
        return success(true)
    }
}

// --- Add Knowledge Base Entry ---

export class AddKnowledgeBaseUseCase {
    constructor(
        private readonly knowledgeBaseRepo: IKnowledgeBaseRepository,
        private readonly ragService: IRagService,
    ) {}

    async execute(orgId: string, input: {
        landingPageId: string | null
        title: string
        content: string
    }): Promise<Result<KnowledgeBase>> {
        if (!input.title || !input.content) {
            return failure(new ValidationError('Título e conteúdo são obrigatórios'))
        }

        const entry = await this.knowledgeBaseRepo.create({
            organizationId: orgId,
            landingPageId: input.landingPageId,
            title: input.title,
            content: input.content,
        })

        if (!entry) return failure(new ValidationError('Erro ao criar entrada'))

        // Index the content asynchronously (don't block the response)
        this.ragService.indexContent(entry.id, `${input.title}\n\n${input.content}`).catch(() => {
            // Embedding failures are non-critical — content saved, can be re-indexed later
        })

        return success(entry)
    }
}

// --- Delete Landing Page ---

export class DeleteLandingPageUseCase {
    constructor(private readonly landingPageRepo: ILandingPageRepository) {}

    async execute(orgId: string, pageId: string): Promise<Result<boolean>> {
        const page = await this.landingPageRepo.findById(pageId)
        if (!page || page.organizationId !== orgId) {
            return failure(new EntityNotFoundError('Landing Page'))
        }
        await this.landingPageRepo.delete(pageId, orgId)
        return success(true)
    }
}

// --- List Landing Pages ---

export class ListLandingPagesUseCase {
    constructor(private readonly landingPageRepo: ILandingPageRepository) {}

    async execute(orgId: string): Promise<LandingPage[]> {
        return this.landingPageRepo.findByOrgId(orgId)
    }
}

// --- List Knowledge Base ---

export class ListKnowledgeBaseUseCase {
    constructor(private readonly knowledgeBaseRepo: IKnowledgeBaseRepository) {}

    async execute(orgId: string, pageId?: string): Promise<KnowledgeBase[]> {
        if (pageId) return this.knowledgeBaseRepo.findByPageId(pageId)
        return this.knowledgeBaseRepo.findByOrgId(orgId)
    }
}

// --- Get Landing Page Analytics ---

export class GetLandingPageAnalyticsUseCase {
    constructor(private readonly analyticsRepo: IAnalyticsRepository) {}

    async execute(pageId: string): Promise<PageAnalyticsSummary> {
        return this.analyticsRepo.getSummary(pageId)
    }
}

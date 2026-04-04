import { z } from 'zod'
import { type Result, success, failure, ValidationError, EntityNotFoundError } from '@/domain/errors'
import type { IProductRepository } from '@/domain/interfaces'
import { Product } from '@/domain/entities'

// --- Schemas ---

const createProductSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(200),
    slug: z.string().min(1, 'Slug é obrigatório').max(100)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug deve conter apenas letras minúsculas, números e hifens'),
    type: z.enum(['product', 'service']).default('product'),
    shortDescription: z.string().max(500).default(''),
    fullDescription: z.string().max(10000).default(''),
    price: z.number().min(0).nullable().optional(),
    priceType: z.enum(['one_time', 'monthly', 'yearly', 'custom']).nullable().optional(),
    currency: z.string().max(3).default('BRL'),
    targetAudience: z.string().max(2000).default(''),
    differentials: z.string().max(5000).default(''),
    tags: z.array(z.string()).default([]),
})

const updateProductSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    slug: z.string().min(1).max(100)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido').optional(),
    type: z.enum(['product', 'service']).optional(),
    shortDescription: z.string().max(500).optional(),
    fullDescription: z.string().max(10000).optional(),
    price: z.number().min(0).nullable().optional(),
    priceType: z.enum(['one_time', 'monthly', 'yearly', 'custom']).nullable().optional(),
    currency: z.string().max(3).optional(),
    targetAudience: z.string().max(2000).optional(),
    differentials: z.string().max(5000).optional(),
    tags: z.array(z.string()).optional(),
    featuresJson: z.array(z.object({ title: z.string(), description: z.string() })).optional(),
    benefitsJson: z.array(z.object({ title: z.string(), description: z.string() })).optional(),
    faqsJson: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
    images: z.array(z.string()).optional(),
    metadataJson: z.record(z.string(), z.unknown()).optional(),
})

// --- Create Product ---

export class CreateProductUseCase {
    constructor(private readonly productRepo: IProductRepository) {}

    async execute(orgId: string, input: {
        name: string
        slug: string
        type?: 'product' | 'service'
        shortDescription?: string
        fullDescription?: string
        price?: number | null
        priceType?: string | null
        currency?: string
        targetAudience?: string
        differentials?: string
        tags?: string[]
        featuresJson?: unknown[]
        benefitsJson?: unknown[]
        faqsJson?: unknown[]
        images?: string[]
        metadataJson?: Record<string, unknown>
    }): Promise<Result<Product>> {
        const parsed = createProductSchema.safeParse(input)
        if (!parsed.success) {
            return failure(new ValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos'))
        }

        // Check slug uniqueness within org
        const existing = await this.productRepo.findBySlug(orgId, parsed.data.slug)
        if (existing) {
            return failure(new ValidationError('Slug já está em uso nesta organização'))
        }

        const product = await this.productRepo.create({
            organizationId: orgId,
            ...parsed.data,
            featuresJson: input.featuresJson,
            benefitsJson: input.benefitsJson,
            faqsJson: input.faqsJson,
            images: input.images,
            metadataJson: input.metadataJson,
        })

        if (!product) return failure(new ValidationError('Erro ao criar produto'))
        return success(product)
    }
}

// --- Update Product ---

export class UpdateProductUseCase {
    constructor(private readonly productRepo: IProductRepository) {}

    async execute(orgId: string, productId: string, input: Record<string, unknown>): Promise<Result<Product>> {
        const parsed = updateProductSchema.safeParse(input)
        if (!parsed.success) {
            return failure(new ValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos'))
        }

        const product = await this.productRepo.update(productId, orgId, parsed.data)
        if (!product) return failure(new EntityNotFoundError('Produto'))
        return success(product)
    }
}

// --- Get Product Detail ---

export class GetProductUseCase {
    constructor(private readonly productRepo: IProductRepository) {}

    async execute(orgId: string, productId: string): Promise<Result<Product>> {
        const product = await this.productRepo.findById(productId)
        if (!product || product.organizationId !== orgId) {
            return failure(new EntityNotFoundError('Produto'))
        }
        return success(product)
    }
}

// --- Activate / Archive Product ---

export class ToggleProductStatusUseCase {
    constructor(private readonly productRepo: IProductRepository) {}

    async execute(orgId: string, productId: string, activate: boolean): Promise<Result<boolean>> {
        const product = await this.productRepo.findById(productId)
        if (!product || product.organizationId !== orgId) {
            return failure(new EntityNotFoundError('Produto'))
        }

        const status = activate ? 'active' as const : 'archived' as const
        const ok = await this.productRepo.updateStatus(productId, orgId, status)
        if (!ok) return failure(new ValidationError('Erro ao atualizar status'))
        return success(true)
    }
}

// --- Delete Product ---

export class DeleteProductUseCase {
    constructor(private readonly productRepo: IProductRepository) {}

    async execute(orgId: string, productId: string): Promise<Result<boolean>> {
        const product = await this.productRepo.findById(productId)
        if (!product || product.organizationId !== orgId) {
            return failure(new EntityNotFoundError('Produto'))
        }
        await this.productRepo.delete(productId, orgId)
        return success(true)
    }
}

// --- List Products ---

export class ListProductsUseCase {
    constructor(private readonly productRepo: IProductRepository) {}

    async execute(orgId: string): Promise<Product[]> {
        return this.productRepo.findByOrgId(orgId)
    }
}

// --- List Active Products (for selects / landing page association) ---

export class ListActiveProductsUseCase {
    constructor(private readonly productRepo: IProductRepository) {}

    async execute(orgId: string): Promise<Product[]> {
        return this.productRepo.findActiveByOrgId(orgId)
    }
}

import type { Product } from '@/domain/entities'
import type { ProductStatus } from '@/domain/entities/product'

export interface CreateProductInput {
    organizationId: string
    name: string
    slug: string
    type?: 'product' | 'service'
    shortDescription?: string
    fullDescription?: string
    price?: number | null
    priceType?: string | null
    currency?: string
    featuresJson?: unknown[]
    benefitsJson?: unknown[]
    faqsJson?: unknown[]
    targetAudience?: string
    differentials?: string
    tags?: string[]
    images?: string[]
    metadataJson?: Record<string, unknown>
}

export interface UpdateProductInput {
    name?: string
    slug?: string
    type?: 'product' | 'service'
    shortDescription?: string
    fullDescription?: string
    price?: number | null
    priceType?: string | null
    currency?: string
    featuresJson?: unknown[]
    benefitsJson?: unknown[]
    faqsJson?: unknown[]
    targetAudience?: string
    differentials?: string
    tags?: string[]
    images?: string[]
    metadataJson?: Record<string, unknown>
}

export interface IProductRepository {
    findById(id: string): Promise<Product | null>
    findBySlug(orgId: string, slug: string): Promise<Product | null>
    findByOrgId(orgId: string): Promise<Product[]>
    findActiveByOrgId(orgId: string): Promise<Product[]>
    create(input: CreateProductInput): Promise<Product | null>
    update(id: string, orgId: string, input: UpdateProductInput): Promise<Product | null>
    updateStatus(id: string, orgId: string, status: ProductStatus): Promise<boolean>
    delete(id: string, orgId: string): Promise<boolean>
}

import { createAdminClient } from '@/lib/supabase/admin'
import { Product } from '@/domain/entities'
import type { IProductRepository, CreateProductInput, UpdateProductInput } from '@/domain/interfaces'
import type { ProductStatus } from '@/domain/entities/product'

export class SupabaseProductRepository implements IProductRepository {
    async findById(id: string): Promise<Product | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single()
        return data ? Product.fromRow(data) : null
    }

    async findBySlug(orgId: string, slug: string): Promise<Product | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('organization_id', orgId)
            .eq('slug', slug)
            .single()
        return data ? Product.fromRow(data) : null
    }

    async findByOrgId(orgId: string): Promise<Product[]> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
        return (data ?? []).map(Product.fromRow)
    }

    async findActiveByOrgId(orgId: string): Promise<Product[]> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('organization_id', orgId)
            .eq('status', 'active')
            .order('name', { ascending: true })
        return (data ?? []).map(Product.fromRow)
    }

    async create(input: CreateProductInput): Promise<Product | null> {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('products')
            .insert({
                organization_id: input.organizationId,
                name: input.name,
                slug: input.slug,
                type: input.type ?? 'product',
                short_description: input.shortDescription ?? '',
                full_description: input.fullDescription ?? '',
                price: input.price ?? null,
                price_type: input.priceType ?? null,
                currency: input.currency ?? 'BRL',
                features_json: (input.featuresJson ?? []) as Record<string, string>[],
                benefits_json: (input.benefitsJson ?? []) as Record<string, string>[],
                faqs_json: (input.faqsJson ?? []) as Record<string, string>[],
                target_audience: input.targetAudience ?? '',
                differentials: input.differentials ?? '',
                tags: input.tags ?? [],
                images: input.images ?? [],
                metadata_json: (input.metadataJson ?? {}) as Record<string, string>,
            })
            .select()
            .single()
        return data ? Product.fromRow(data) : null
    }

    async update(id: string, orgId: string, input: UpdateProductInput): Promise<Product | null> {
        const supabase = createAdminClient()
        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

        if (input.name !== undefined) updateData.name = input.name
        if (input.slug !== undefined) updateData.slug = input.slug
        if (input.type !== undefined) updateData.type = input.type
        if (input.shortDescription !== undefined) updateData.short_description = input.shortDescription
        if (input.fullDescription !== undefined) updateData.full_description = input.fullDescription
        if (input.price !== undefined) updateData.price = input.price
        if (input.priceType !== undefined) updateData.price_type = input.priceType
        if (input.currency !== undefined) updateData.currency = input.currency
        if (input.featuresJson !== undefined) updateData.features_json = input.featuresJson
        if (input.benefitsJson !== undefined) updateData.benefits_json = input.benefitsJson
        if (input.faqsJson !== undefined) updateData.faqs_json = input.faqsJson
        if (input.targetAudience !== undefined) updateData.target_audience = input.targetAudience
        if (input.differentials !== undefined) updateData.differentials = input.differentials
        if (input.tags !== undefined) updateData.tags = input.tags
        if (input.images !== undefined) updateData.images = input.images
        if (input.metadataJson !== undefined) updateData.metadata_json = input.metadataJson

        const { data } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .eq('organization_id', orgId)
            .select()
            .single()
        return data ? Product.fromRow(data) : null
    }

    async updateStatus(id: string, orgId: string, status: ProductStatus): Promise<boolean> {
        const supabase = createAdminClient()
        const { error } = await supabase
            .from('products')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('organization_id', orgId)
        return !error
    }

    async delete(id: string, orgId: string): Promise<boolean> {
        const supabase = createAdminClient()
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .eq('organization_id', orgId)
        return !error
    }
}

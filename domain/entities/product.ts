export type ProductType = 'product' | 'service'
export type ProductStatus = 'draft' | 'active' | 'archived'
export type ProductPriceType = 'one_time' | 'monthly' | 'yearly' | 'custom'

export interface ProductFeature {
    title: string
    description: string
}

export interface ProductBenefit {
    title: string
    description: string
}

export interface ProductFaq {
    question: string
    answer: string
}

export interface ProductProps {
    id: string
    organizationId: string
    name: string
    slug: string
    type: ProductType
    shortDescription: string
    fullDescription: string
    price: number | null
    priceType: ProductPriceType | null
    currency: string
    features: ProductFeature[]
    benefits: ProductBenefit[]
    faqs: ProductFaq[]
    targetAudience: string
    differentials: string
    tags: string[]
    images: string[]
    status: ProductStatus
    metadataJson: Record<string, unknown>
    createdAt: string
    updatedAt: string
}

export class Product {
    constructor(public readonly props: ProductProps) {}

    get id() { return this.props.id }
    get organizationId() { return this.props.organizationId }
    get name() { return this.props.name }
    get slug() { return this.props.slug }
    get type() { return this.props.type }
    get shortDescription() { return this.props.shortDescription }
    get fullDescription() { return this.props.fullDescription }
    get price() { return this.props.price }
    get priceType() { return this.props.priceType }
    get currency() { return this.props.currency }
    get features() { return this.props.features }
    get benefits() { return this.props.benefits }
    get faqs() { return this.props.faqs }
    get targetAudience() { return this.props.targetAudience }
    get differentials() { return this.props.differentials }
    get tags() { return this.props.tags }
    get images() { return this.props.images }
    get status() { return this.props.status }
    get metadataJson() { return this.props.metadataJson }
    get createdAt() { return this.props.createdAt }
    get updatedAt() { return this.props.updatedAt }

    isDraft(): boolean { return this.status === 'draft' }
    isActive(): boolean { return this.status === 'active' }
    isArchived(): boolean { return this.status === 'archived' }
    isProduct(): boolean { return this.type === 'product' }
    isService(): boolean { return this.type === 'service' }

    get formattedPrice(): string {
        if (this.price === null) return 'Sob consulta'
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: this.currency }).format(this.price)
    }

    /** Gera contexto textual completo para o agente IA */
    toAIContext(): string {
        const lines: string[] = [
            `## ${this.name}`,
            `Tipo: ${this.isProduct() ? 'Produto Digital' : 'Serviço Digital'}`,
            '',
            `### Descrição`,
            this.fullDescription || this.shortDescription,
        ]

        if (this.price !== null) {
            const priceLabels: Record<string, string> = {
                one_time: 'pagamento único',
                monthly: '/mês',
                yearly: '/ano',
                custom: 'personalizado',
            }
            lines.push('', `### Preço`, `${this.formattedPrice} ${this.priceType ? priceLabels[this.priceType] ?? '' : ''}`)
        }

        if (this.features.length > 0) {
            lines.push('', `### Funcionalidades`)
            this.features.forEach(f => lines.push(`- **${f.title}**: ${f.description}`))
        }

        if (this.benefits.length > 0) {
            lines.push('', `### Benefícios`)
            this.benefits.forEach(b => lines.push(`- **${b.title}**: ${b.description}`))
        }

        if (this.targetAudience) {
            lines.push('', `### Público-alvo`, this.targetAudience)
        }

        if (this.differentials) {
            lines.push('', `### Diferenciais`, this.differentials)
        }

        if (this.faqs.length > 0) {
            lines.push('', `### Perguntas Frequentes`)
            this.faqs.forEach(f => lines.push(`**P: ${f.question}**`, `R: ${f.answer}`, ''))
        }

        return lines.join('\n')
    }

    static fromRow(row: {
        id: string
        organization_id: string
        name: string
        slug: string
        type: string
        short_description: string
        full_description: string
        price: number | null
        price_type: string | null
        currency: string
        features_json: unknown
        benefits_json: unknown
        faqs_json: unknown
        target_audience: string
        differentials: string
        tags: string[]
        images: string[]
        status: string
        metadata_json: unknown
        created_at: string
        updated_at: string
    }): Product {
        return new Product({
            id: row.id,
            organizationId: row.organization_id,
            name: row.name,
            slug: row.slug,
            type: row.type as ProductType,
            shortDescription: row.short_description,
            fullDescription: row.full_description,
            price: row.price,
            priceType: row.price_type as ProductPriceType | null,
            currency: row.currency,
            features: Array.isArray(row.features_json) ? row.features_json as ProductFeature[] : [],
            benefits: Array.isArray(row.benefits_json) ? row.benefits_json as ProductBenefit[] : [],
            faqs: Array.isArray(row.faqs_json) ? row.faqs_json as ProductFaq[] : [],
            targetAudience: row.target_audience,
            differentials: row.differentials,
            tags: row.tags ?? [],
            images: row.images ?? [],
            status: row.status as ProductStatus,
            metadataJson: (row.metadata_json as Record<string, unknown>) ?? {},
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        })
    }
}

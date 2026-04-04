import { notFound } from 'next/navigation'
import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { PageHeader } from '@/components/layout/PageHeader'
import { DeleteProductButton } from '@/components/crm/DeleteProductButton'
import { ToggleProductStatusButton } from '@/components/crm/ToggleProductStatusButton'
import { ProductEditor } from '@/components/crm/ProductEditor'
import { Package, Sparkles, Target, Star, HelpCircle, Tag } from 'lucide-react'

export default async function ProductDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const auth = await tryGetAuthContext()
    if (!auth) notFound()

    const result = await useCases.getProduct().execute(auth.orgId, id)
    if (!result.ok) notFound()
    const product = result.value

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                category="Catálogo"
                title={product.name}
                icon={Package}
                actions={
                    <div className="flex items-center gap-3">
                        <ToggleProductStatusButton productId={product.id} isActive={product.isActive()} />
                        <DeleteProductButton productId={product.id} productName={product.name} redirectAfterDelete />
                    </div>
                }
            />

            <div className="grid grid-cols-3 gap-6">
                {/* Editor - Left 2 cols */}
                <div className="col-span-2">
                    <div className="bg-card border border-border rounded-(--radius) p-6">
                        <h2 className="text-lg font-bold mb-4">Editar Produto</h2>
                        <ProductEditor product={{
                            id: product.id,
                            name: product.name,
                            slug: product.slug,
                            type: product.type,
                            shortDescription: product.shortDescription,
                            fullDescription: product.fullDescription,
                            price: product.price,
                            priceType: product.priceType,
                            currency: product.currency,
                            targetAudience: product.targetAudience,
                            differentials: product.differentials,
                            tags: product.tags,
                            features: product.features,
                            benefits: product.benefits,
                            faqs: product.faqs,
                        }} />
                    </div>
                </div>

                {/* Sidebar - Right col */}
                <div className="space-y-6">
                    {/* Status & Info */}
                    <div className="bg-card border border-border rounded-(--radius) p-6">
                        <h2 className="text-lg font-bold mb-3">Informações</h2>
                        <div className="space-y-2.5 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <span className="font-medium capitalize">{product.status}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tipo</span>
                                <span className="font-medium">{product.isProduct() ? 'Produto' : 'Serviço'}</span>
                            </div>
                            {product.price !== null && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Preço</span>
                                    <span className="font-bold text-primary">{product.formattedPrice}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Criado</span>
                                <span>{new Date(product.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Atualizado</span>
                                <span>{new Date(product.updatedAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-card border border-border rounded-(--radius) p-6">
                        <h2 className="text-lg font-bold mb-3">Conteúdo para IA</h2>
                        <div className="space-y-3">
                            {[
                                { label: 'Funcionalidades', value: product.features.length, icon: Sparkles },
                                { label: 'Benefícios', value: product.benefits.length, icon: Star },
                                { label: 'FAQs', value: product.faqs.length, icon: HelpCircle },
                                { label: 'Tags', value: product.tags.length, icon: Tag },
                            ].map(({ label, value, icon: Icon }) => (
                                <div key={label} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">{label}</span>
                                    </div>
                                    <span className="text-sm font-bold">{value}</span>
                                </div>
                            ))}
                        </div>
                        {product.targetAudience && (
                            <div className="mt-4 pt-4 border-t border-border">
                                <div className="flex items-center gap-2 mb-1">
                                    <Target className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Público-alvo</span>
                                </div>
                                <p className="text-sm text-foreground-secondary line-clamp-3">{product.targetAudience}</p>
                            </div>
                        )}
                    </div>

                    {/* AI Context Preview */}
                    <div className="bg-card border border-border rounded-(--radius) p-6">
                        <h2 className="text-lg font-bold mb-3">Preview: Contexto IA</h2>
                        <p className="text-xs text-muted-foreground mb-3">
                            Este é o texto que será enviado ao agente IA como contexto sobre o produto.
                        </p>
                        <div className="bg-secondary/50 rounded-(--radius) p-4 max-h-64 overflow-y-auto">
                            <pre className="text-xs text-foreground-secondary whitespace-pre-wrap font-mono leading-relaxed">
                                {product.toAIContext()}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

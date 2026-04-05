import { notFound } from 'next/navigation'
import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { PageHeader } from '@/components/layout/PageHeader'
import { DeleteProductButton } from '@/components/crm/DeleteProductButton'
import { ToggleProductStatusButton } from '@/components/crm/ToggleProductStatusButton'
import { ProductEditor } from '@/components/crm/ProductEditor'
import { Package, Sparkles, Target, Star, HelpCircle, Tag, Bot, Calendar, RefreshCw, DollarSign, Layers } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
    active: { label: 'Ativo', dot: 'bg-[hsl(var(--success))]' },
    draft: { label: 'Rascunho', dot: 'bg-muted-foreground' },
    archived: { label: 'Arquivado', dot: 'bg-destructive' },
}

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

    const status = STATUS_CONFIG[product.status] ?? STATUS_CONFIG.draft
    const aiContentScore = [
        product.fullDescription ? 1 : 0,
        product.features.length > 0 ? 1 : 0,
        product.benefits.length > 0 ? 1 : 0,
        product.faqs.length > 0 ? 1 : 0,
        product.targetAudience ? 1 : 0,
        product.differentials ? 1 : 0,
    ].reduce((a, b) => a + b, 0)
    const aiContentPercent = Math.round((aiContentScore / 6) * 100)

    return (
        <div className="p-6 md:p-8 space-y-6">
            <PageHeader
                category="Catálogo"
                title={product.name}
                icon={Package}
                actions={
                    <div className="flex items-center gap-2.5">
                        <ToggleProductStatusButton productId={product.id} isActive={product.isActive()} />
                        <DeleteProductButton productId={product.id} productName={product.name} redirectAfterDelete />
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Editor - Left 2 cols */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card border border-border rounded-(--radius) overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-accent/30">
                            <h2 className="text-sm font-bold text-foreground">Informações do Produto</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Dados usados para landing pages, campanhas e agente IA.</p>
                        </div>
                        <div className="p-6">
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
                </div>

                {/* Sidebar - Right col */}
                <div className="space-y-5">
                    {/* Status Card */}
                    <div className="bg-card border border-border rounded-(--radius) overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-border bg-accent/30">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Detalhes</h2>
                        </div>
                        <div className="p-5 space-y-3.5">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-xs">Status</span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                    <span className="text-foreground text-xs font-semibold">{status.label}</span>
                                </div>
                            </div>
                            <div className="h-px bg-border-subtle" />
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                                    <Layers className="w-3 h-3" /> Tipo
                                </span>
                                <span className="text-foreground text-xs font-semibold">{product.isProduct() ? 'Produto Digital' : 'Serviço Digital'}</span>
                            </div>
                            {product.price !== null && (
                                <>
                                    <div className="h-px bg-border-subtle" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                                            <DollarSign className="w-3 h-3" /> Preço
                                        </span>
                                        <span className="text-primary text-sm font-bold">{product.formattedPrice}</span>
                                    </div>
                                </>
                            )}
                            <div className="h-px bg-border-subtle" />
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" /> Criado
                                </span>
                                <span className="text-foreground text-xs font-mono-data">{new Date(product.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="h-px bg-border-subtle" />
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                                    <RefreshCw className="w-3 h-3" /> Atualizado
                                </span>
                                <span className="text-foreground text-xs font-mono-data">{new Date(product.updatedAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>
                    </div>

                    {/* AI Content Score */}
                    <div className="bg-card border border-border rounded-(--radius) overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-border bg-accent/30">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Bot className="w-3.5 h-3.5" /> Conteúdo IA
                                </h2>
                                <span className={`text-xs font-bold ${aiContentPercent === 100 ? 'text-[hsl(var(--success))]' : aiContentPercent >= 50 ? 'text-[hsl(var(--warning))]' : 'text-destructive'}`}>
                                    {aiContentPercent}%
                                </span>
                            </div>
                        </div>
                        <div className="p-5">
                            {/* Progress bar */}
                            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-4">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${aiContentPercent === 100 ? 'bg-[hsl(var(--success))]' : aiContentPercent >= 50 ? 'bg-[hsl(var(--warning))]' : 'bg-destructive'}`}
                                    style={{ width: `${aiContentPercent}%` }}
                                />
                            </div>
                            <div className="space-y-2.5">
                                {[
                                    { label: 'Funcionalidades', value: product.features.length, icon: Sparkles, filled: product.features.length > 0 },
                                    { label: 'Benefícios', value: product.benefits.length, icon: Star, filled: product.benefits.length > 0 },
                                    { label: 'FAQs', value: product.faqs.length, icon: HelpCircle, filled: product.faqs.length > 0 },
                                    { label: 'Tags', value: product.tags.length, icon: Tag, filled: product.tags.length > 0 },
                                ].map(({ label, value, icon: Icon, filled }) => (
                                    <div key={label} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${filled ? 'bg-[hsl(var(--primary-subtle))]' : 'bg-secondary'}`}>
                                                <Icon className={`w-3 h-3 ${filled ? 'text-primary' : 'text-muted-foreground/50'}`} />
                                            </div>
                                            <span className="text-xs text-muted-foreground">{label}</span>
                                        </div>
                                        <span className={`text-xs font-bold tabular-nums ${filled ? 'text-foreground' : 'text-muted-foreground/40'}`}>{value}</span>
                                    </div>
                                ))}
                            </div>
                            {product.targetAudience && (
                                <div className="mt-4 pt-4 border-t border-border-subtle">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <Target className="w-3 h-3 text-primary" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Público-alvo</span>
                                    </div>
                                    <p className="text-xs text-foreground-secondary leading-relaxed line-clamp-3">{product.targetAudience}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AI Context Preview */}
                    <div className="bg-card border border-border rounded-(--radius) overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-border bg-accent/30">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preview: Contexto IA</h2>
                        </div>
                        <div className="p-4">
                            <p className="text-[11px] text-muted-foreground/70 mb-3 leading-relaxed">
                                Texto enviado ao agente IA como contexto sobre o produto.
                            </p>
                            <div className="bg-background rounded-lg border border-border-subtle p-4 max-h-72 overflow-y-auto scrollbar-thin">
                                <pre className="text-[11px] text-foreground-secondary whitespace-pre-wrap font-mono leading-[1.7]">
                                    {product.toAIContext()}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

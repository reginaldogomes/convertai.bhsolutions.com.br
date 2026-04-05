import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { CreateProductButton } from '@/components/crm/CreateProductButton'
import { PageHeader } from '@/components/layout/PageHeader'
import { Package, ShoppingBag, ArrowRight, Sparkles, HelpCircle, Tag } from 'lucide-react'
import Link from 'next/link'

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    active: { label: 'Ativo', className: 'bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))] border-[hsl(var(--success))]' },
    archived: { label: 'Arquivado', className: 'bg-[hsl(var(--destructive-subtle))] text-destructive border-destructive' },
    draft: { label: 'Rascunho', className: 'bg-secondary text-foreground-secondary border-border' },
}

const PRICE_TYPE_LABELS: Record<string, string> = {
    one_time: 'único',
    monthly: '/mês',
    yearly: '/ano',
    custom: 'personalizado',
}

export default async function ProductsPage() {
    const auth = await tryGetAuthContext()
    const products = auth
        ? await useCases.listProducts().execute(auth.orgId)
        : []

    const activeCount = products.filter(p => p.isActive()).length

    return (
        <div className="p-6 md:p-8 space-y-6">
            <PageHeader
                category="Catálogo"
                title="Produtos & Serviços"
                icon={Package}
                actions={
                    <>
                        <span className="text-muted-foreground text-xs font-mono-data">
                            {activeCount} ativo{activeCount !== 1 ? 's' : ''} de {products.length}
                        </span>
                        <CreateProductButton />
                    </>
                }
            />

            {products.length === 0 ? (
                <div className="bg-card border border-border rounded-(--radius)">
                    <div className="py-20 px-6 text-center flex flex-col items-center justify-center">
                        <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--primary-subtle))] flex items-center justify-center mb-5">
                            <ShoppingBag className="w-7 h-7 text-primary" />
                        </div>
                        <h3 className="text-foreground font-bold text-base mb-1.5">Nenhum produto cadastrado</h3>
                        <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                            Cadastre seus produtos e serviços digitais para gerar landing pages otimizadas e alimentar o agente IA com informações ricas.
                        </p>
                        <div className="mt-6">
                            <CreateProductButton />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-(--radius) overflow-hidden">
                    {/* Table header */}
                    <div className="hidden md:grid grid-cols-[1fr_140px_100px_120px_80px] gap-4 px-5 py-3 border-b border-border bg-accent/30">
                        <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Produto</span>
                        <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Preço</span>
                        <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Tipo</span>
                        <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Status</span>
                        <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium text-right">Ações</span>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-border-subtle">
                        {products.map((product) => {
                            const status = STATUS_CONFIG[product.status] ?? STATUS_CONFIG.draft
                            return (
                                <Link
                                    key={product.id}
                                    href={`/products/${product.id}`}
                                    className="group grid grid-cols-1 md:grid-cols-[1fr_140px_100px_120px_80px] gap-2 md:gap-4 items-center px-5 py-4 hover:bg-accent/50 transition-all duration-200"
                                >
                                    {/* Name + Description + Meta */}
                                    <div className="min-w-0 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-foreground font-semibold text-sm group-hover:text-primary transition-colors truncate">
                                                {product.name}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground text-xs truncate leading-relaxed">
                                            {product.shortDescription || 'Sem descrição'}
                                        </p>
                                        {/* Meta chips */}
                                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
                                            {product.features.length > 0 && (
                                                <span className="inline-flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" />
                                                    {product.features.length}
                                                </span>
                                            )}
                                            {product.faqs.length > 0 && (
                                                <span className="inline-flex items-center gap-1">
                                                    <HelpCircle className="w-3 h-3" />
                                                    {product.faqs.length}
                                                </span>
                                            )}
                                            {product.tags.length > 0 && (
                                                <span className="inline-flex items-center gap-1">
                                                    <Tag className="w-3 h-3" />
                                                    {product.tags.slice(0, 2).join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="hidden md:block">
                                        {product.price !== null ? (
                                            <div>
                                                <span className="text-foreground font-bold text-sm">{product.formattedPrice}</span>
                                                {product.priceType && (
                                                    <span className="text-muted-foreground text-xs ml-0.5">
                                                        {PRICE_TYPE_LABELS[product.priceType] ?? ''}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground/50 text-xs">Sob consulta</span>
                                        )}
                                    </div>

                                    {/* Type */}
                                    <div className="hidden md:block">
                                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider border border-border rounded-md bg-secondary/50 text-muted-foreground">
                                            {product.isProduct() ? 'Produto' : 'Serviço'}
                                        </span>
                                    </div>

                                    {/* Status */}
                                    <div className="hidden md:block">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider border rounded-md ${status.className}`}>
                                            {status.label}
                                        </span>
                                    </div>

                                    {/* Arrow */}
                                    <div className="hidden md:flex justify-end items-center">
                                        <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

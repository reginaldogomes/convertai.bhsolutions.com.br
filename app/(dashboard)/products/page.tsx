import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { CreateProductButton } from '@/components/crm/CreateProductButton'
import { DeleteProductButton } from '@/components/crm/DeleteProductButton'
import { PageHeader } from '@/components/layout/PageHeader'
import { Package, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export default async function ProductsPage() {
    const auth = await tryGetAuthContext()
    const products = auth
        ? await useCases.listProducts().execute(auth.orgId)
        : []

    const statusStyles: Record<string, string> = {
        active: 'bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))] border-[hsl(var(--success))]',
        archived: 'bg-[hsl(var(--destructive-subtle))] text-destructive border-destructive',
        draft: 'bg-secondary text-foreground-secondary border-border',
    }

    const priceTypeLabels: Record<string, string> = {
        one_time: 'Pagamento único',
        monthly: '/mês',
        yearly: '/ano',
        custom: 'Personalizado',
    }

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                category="Catálogo"
                title="Produtos & Serviços"
                icon={Package}
                actions={<CreateProductButton />}
            />

            <div className="bg-card border border-border rounded-(--radius)">
                {products.length === 0 && (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-sm">Nenhum produto cadastrado.</p>
                        <p className="text-muted-foreground/60 text-xs mt-1">
                            Cadastre seus produtos e serviços para gerar landing pages e alimentar o agente IA.
                        </p>
                    </div>
                )}

                <div className="divide-y divide-border-subtle">
                    {products.map((product) => (
                        <div key={product.id} className="p-5 flex items-center justify-between hover:bg-accent transition-colors">
                            <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-3">
                                    <Link href={`/products/${product.id}`} className="text-foreground font-bold hover:text-primary transition-colors truncate">
                                        {product.name}
                                    </Link>
                                    <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider border rounded-(--radius) shrink-0 ${
                                        statusStyles[product.status] ?? statusStyles.draft
                                    }`}>
                                        {product.status}
                                    </span>
                                    <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider border border-border rounded-(--radius) bg-secondary text-muted-foreground shrink-0">
                                        {product.isProduct() ? 'Produto' : 'Serviço'}
                                    </span>
                                </div>
                                <p className="text-muted-foreground text-sm truncate">
                                    {product.shortDescription || 'Sem descrição'}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    {product.price !== null && (
                                        <span className="font-semibold text-foreground">
                                            {product.formattedPrice}
                                            {product.priceType ? ` ${priceTypeLabels[product.priceType] ?? ''}` : ''}
                                        </span>
                                    )}
                                    {product.features.length > 0 && (
                                        <span>{product.features.length} funcionalidades</span>
                                    )}
                                    {product.faqs.length > 0 && (
                                        <span>{product.faqs.length} FAQs</span>
                                    )}
                                    {product.tags.length > 0 && (
                                        <span>{product.tags.slice(0, 3).join(', ')}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 ml-4">
                                <Link
                                    href={`/products/${product.id}`}
                                    className="text-sm text-primary hover:underline"
                                >
                                    Editar
                                </Link>
                                <DeleteProductButton productId={product.id} productName={product.name} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

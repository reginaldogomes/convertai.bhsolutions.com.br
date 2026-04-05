import { redirect } from 'next/navigation'
import { tryGetAuthContext } from '@/infrastructure/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { NewProductForm } from '@/components/crm/NewProductForm'
import { Package } from 'lucide-react'
import Link from 'next/link'

export default async function NewProductPage() {
    const auth = await tryGetAuthContext()
    if (!auth) redirect('/login')

    return (
        <div className="p-6 md:p-8 space-y-6">
            <PageHeader
                category="Catálogo"
                title="Novo Produto"
                icon={Package}
                actions={
                    <Link
                        href="/products"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancelar
                    </Link>
                }
            />
            <NewProductForm />
        </div>
    )
}

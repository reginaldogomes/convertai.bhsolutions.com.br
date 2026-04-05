import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function CreateProductButton() {
    return (
        <Button asChild>
            <Link href="/products/new">
                <Plus className="w-4 h-4 mr-2" />
                Novo Produto
            </Link>
        </Button>
    )
}

import Link from 'next/link'
import { BRAND } from '@/lib/brand'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
            <div className="text-center space-y-6 max-w-md">
                <div className="space-y-2">
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] font-medium">
                        {BRAND.name}
                    </p>
                    <h1 className="text-foreground text-6xl font-black tracking-tight">
                        404
                    </h1>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        A página que você está procurando não existe ou foi movida.
                    </p>
                </div>
                <Link
                    href="/"
                    className="inline-flex items-center justify-center h-10 px-6 text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-(--radius)"
                >
                    Voltar ao Dashboard
                </Link>
            </div>
        </div>
    )
}

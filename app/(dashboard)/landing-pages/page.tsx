import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { CreateLandingPageButton } from '@/components/crm/CreateLandingPageButton'
import { PageHeader } from '@/components/layout/PageHeader'
import { Globe, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default async function LandingPagesPage() {
    const auth = await tryGetAuthContext()
    const pages = auth
        ? await useCases.listLandingPages().execute(auth.orgId)
        : []

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                category="Landing Pages"
                title="Suas Landing Pages"
                icon={Globe}
                actions={<CreateLandingPageButton />}
            />

            <div className="bg-card border border-border rounded-(--radius)">
                {pages.length === 0 && (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <Globe className="w-8 h-8 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-sm">Nenhuma landing page criada.</p>
                        <p className="text-muted-foreground/60 text-xs mt-1">
                            Crie sua primeira landing page com chatbot inteligente.
                        </p>
                    </div>
                )}

                <div className="divide-y divide-border-subtle">
                    {pages.map((page) => (
                        <div key={page.id} className="p-5 flex items-center justify-between hover:bg-secondary/70 transition-colors">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <Link href={`/landing-pages/${page.id}`} className="text-foreground font-bold hover:text-primary transition-colors">
                                        {page.name}
                                    </Link>
                                    <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider border rounded-(--radius) ${
                                        page.isPublished()
                                            ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20'
                                            : page.isArchived()
                                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                                : 'bg-secondary text-foreground-secondary border-border'
                                    }`}>
                                        {page.status}
                                    </span>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    /p/{page.slug} — {page.headline || 'Sem título'}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                {page.isPublished() && (
                                    <a
                                        href={`/p/${page.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                                <Link
                                    href={`/landing-pages/${page.id}`}
                                    className="text-sm text-primary hover:underline"
                                >
                                    Editar
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

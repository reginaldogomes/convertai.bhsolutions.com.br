import { tryGetAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { CreateLandingPageButton } from '@/components/crm/CreateLandingPageButton'
import { DeleteLandingPageButton } from '@/components/crm/DeleteLandingPageButton'
import { PageHeader } from '@/components/layout/PageHeader'
import { Globe, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { PublishToggleButton } from '@/components/crm/PublishToggleButton'

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
                        <div key={page.id} className="p-5 flex items-center justify-between hover:bg-accent transition-colors">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <Link href={`/landing-pages/${page.id}`} className="text-foreground font-bold hover:text-primary transition-colors">
                                        {page.name}
                                    </Link>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    /p/{page.slug} — {page.headline || 'Sem título'}
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end text-right">
                                    <span className="text-xs font-semibold">
                                        {page.isPublished() ? 'Publicada' : 'Rascunho'}
                                    </span>
                                    <PublishToggleButton pageId={page.id} isPublished={page.isPublished()} />
                                </div>
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
                                <DeleteLandingPageButton pageId={page.id} pageName={page.name} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

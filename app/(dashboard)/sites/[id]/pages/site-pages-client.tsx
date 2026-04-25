'use client'

import { FileText, Eye, Edit, Trash2, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { InlineNotice } from '@/components/ui/inline-notice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

// Plain object type for client component
interface PlainLandingPage {
    id: string
    title: string
    slug: string
    isPublished: boolean
    isHomepage: boolean
    createdAt: string
    updatedAt: string
}

interface SitePagesClientProps {
    siteId: string
    initialLandingPages: PlainLandingPage[]
    initialError?: string | null
}

export function SitePagesClient({ siteId, initialLandingPages, initialError }: SitePagesClientProps) {
    const router = useRouter()

    const handleCreateLandingPage = () => {
        router.push('/landing-pages/new')
    }

    const handleViewLandingPage = (landingPageId: string) => {
        router.push(`/landing-pages/${landingPageId}`)
    }

    const handleEditLandingPage = (landingPageId: string) => {
        router.push(`/landing-pages/${landingPageId}/edit`)
    }

    return (
        <div className="space-y-6">
            <PageHeader
                category="Landing Pages"
                title="Landing Pages da Organização"
                icon={FileText}
            />

            {initialError && (
                <InlineNotice variant="destructive" message={initialError} className="mb-4" size="sm" />
            )}

            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                    Gerencie todas as landing pages da sua organização
                </p>
                <Button onClick={handleCreateLandingPage} className="h-9 px-5 text-xs font-bold uppercase tracking-wider gap-2">
                    <Plus className="w-4 h-4" />
                    Nova Landing Page
                </Button>
            </div>

            {initialLandingPages.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">
                            Nenhuma landing page criada
                        </h3>
                        <p className="text-muted-foreground text-center mb-6 max-w-md">
                            Comece criando sua primeira landing page para este site.
                            Use templates pré-definidos ou crie do zero.
                        </p>
                        <Button onClick={handleCreateLandingPage} className="h-9 px-5 text-xs font-bold uppercase tracking-wider gap-2">
                            <Plus className="w-4 h-4" />
                            Criar Primeira Landing Page
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {initialLandingPages.map((page) => (
                        <Card key={page.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-base truncate">{page.title}</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            /{page.slug}
                                        </p>
                                    </div>
                                    <div className="flex gap-1 ml-2">
                                        {page.isHomepage && (
                                            <Badge variant="secondary" className="text-xs">
                                                Homepage
                                            </Badge>
                                        )}
                                        <Badge
                                            variant={page.isPublished ? "default" : "outline"}
                                            className="text-xs"
                                        >
                                            {page.isPublished ? 'Publicado' : 'Rascunho'}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <p className="text-xs text-muted-foreground mb-4">
                                    Atualizado em {new Date(page.updatedAt).toLocaleDateString('pt-BR')}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-8"
                                        onClick={() => handleViewLandingPage(page.id)}
                                    >
                                        <Eye className="w-3 h-3 mr-1" />
                                        Ver
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-8"
                                        onClick={() => handleEditLandingPage(page.id)}
                                    >
                                        <Edit className="w-3 h-3 mr-1" />
                                        Editar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
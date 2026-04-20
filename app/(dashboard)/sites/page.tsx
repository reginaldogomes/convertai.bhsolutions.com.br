import Link from 'next/link'
import { Globe, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { useCases } from '@/application/services/container'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAuthContext } from '@/infrastructure/auth'

export const dynamic = 'force-dynamic'

export default async function SitesPage() {
    const { orgId } = await getAuthContext()
    const sites = await useCases.listSites().execute(orgId)

    return (
        <div className="flex flex-col gap-8">
            <PageHeader category="Gerenciamento" title="Seus Sites" icon={Globe}>
                <Button asChild>
                    <Link href="/sites/create">
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Novo Site
                    </Link>
                </Button>
            </PageHeader>

            <Card>
                <CardHeader>
                    <CardTitle>Sites Criados</CardTitle>
                    <CardDescription>
                        Aqui estão todos os sites que você criou para esta organização.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sites.length > 0 ? (
                        <ul className="space-y-4">
                            {sites.map(site => (
                                <li key={site.id} className="flex justify-between items-center p-4 border rounded-md">
                                    <span className="font-medium">{site.name}</span>
                                    <span className="text-sm text-muted-foreground">
                                        Criado {formatDistanceToNow(site.createdAt, { addSuffix: true, locale: ptBR })}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Nenhum site criado ainda.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

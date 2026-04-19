import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe } from 'lucide-react'
import { SiteCreateForm } from './_components/site-create-form'

export default function CreateSitePage() {
    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                category="Sites"
                title="Criar Novo Site"
                icon={Globe}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Detalhes do Site</CardTitle>
                    <CardDescription>
                        Um site agrupa um conjunto de landing pages sob um único domínio. Dê um nome para identificá-lo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SiteCreateForm />
                </CardContent>
            </Card>
        </div>
    )
}
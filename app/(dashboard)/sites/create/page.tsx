import { Globe } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { SiteCreateForm } from '@/components/layout/site-create-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function CreateSitePage() {
    return (
        <div className="flex flex-col gap-8 max-w-2xl">
            <PageHeader category="Gerenciamento" title="Criar Site" icon={Globe} />

            <Card>
                <CardHeader>
                    <CardTitle>Novo site</CardTitle>
                    <CardDescription>
                        Crie um novo site para sua organização. Você poderá configurar domínio personalizado depois.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SiteCreateForm />
                </CardContent>
            </Card>
        </div>
    )
}

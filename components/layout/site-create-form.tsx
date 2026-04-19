'use client'

import { useActionState } from 'react'
import { createSite } from '@/actions/sites'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { InlineNotice } from '@/components/ui/inline-notice'
import { Loader } from 'lucide-react'

export function SiteCreateForm() {
    const [state, action, pending] = useActionState(createSite, { error: '' })

    return (
        <form action={action} className="max-w-md">
            <fieldset disabled={pending} className="space-y-6">
                {state?.error && (
                    <InlineNotice variant="destructive" message={state.error} />
                )}

                <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground-secondary text-xs uppercase tracking-wider">
                        Nome do Site
                    </Label>
                    <Input
                        id="name"
                        name="name"
                        placeholder="Ex: Site Institucional"
                        required
                        aria-describedby="name-description"
                        className="bg-[hsl(var(--background-tertiary))] border-border text-foreground h-9"
                    />
                    <p id="name-description" className="text-xs text-muted-foreground">
                        Este nome é apenas para sua organização interna.
                    </p>
                </div>

                <Button type="submit" className="h-9 px-5 text-xs font-bold uppercase tracking-wider gap-2">
                    {pending && <Loader className="w-4 h-4 animate-spin" />}
                    Criar Site
                </Button>
            </fieldset>
        </form>
    )
}
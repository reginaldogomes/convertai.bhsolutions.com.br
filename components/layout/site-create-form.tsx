'use client'

import { useActionState } from 'react'

import { createSite } from '@/actions/sites'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InlineNotice } from '@/components/ui/inline-notice'

const initialState = { error: '' }

export function SiteCreateForm() {
    const [state, formAction, isPending] = useActionState(createSite, initialState)

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome do site</Label>
                <Input
                    id="name"
                    name="name"
                    minLength={3}
                    maxLength={50}
                    placeholder="Ex.: Site Principal"
                    required
                />
            </div>

            {state.error ? <InlineNotice variant="destructive" message={state.error} size="sm" /> : null}

            <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Criando...' : 'Criar site'}
                </Button>
            </div>
        </form>
    )
}

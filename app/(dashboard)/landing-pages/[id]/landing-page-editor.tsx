'use client'

import { useActionState } from 'react'
import { updateLandingPage } from '@/actions/landing-pages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DesignSystemPicker } from '@/components/crm/DesignSystemPicker'
import { useCallback, useState } from 'react'
import type { DesignSystem } from '@/domain/value-objects/design-system'
import { DEFAULT_DESIGN_SYSTEM, designSystemFromPrimaryColor } from '@/domain/value-objects/design-system'

interface LandingPageEditorProps {
    page: {
        id: string
        name: string
        slug: string
        headline: string
        subheadline: string
        ctaText: string
        chatbotName: string
        chatbotWelcomeMessage: string
        chatbotSystemPrompt: string
        theme: string
        primaryColor: string
        designSystem?: DesignSystem
    }
}

export function LandingPageEditor({ page }: LandingPageEditorProps) {
    const initialDesignSystem = page.designSystem
        ?? designSystemFromPrimaryColor(page.primaryColor, page.theme as 'light' | 'dark')

    const [designSystem, setDesignSystem] = useState<DesignSystem>(initialDesignSystem)

    const boundAction = useCallback(
        (state: { error: string; success: boolean }, formData: FormData) =>
            updateLandingPage(page.id, state, formData),
        [page.id]
    )

    const [state, action, isPending] = useActionState(boundAction, { error: '', success: false })

    return (
        <form action={action} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" name="name" defaultValue={page.name} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input id="slug" name="slug" defaultValue={page.slug} required
                        pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="headline">Título Principal</Label>
                <Input id="headline" name="headline" defaultValue={page.headline} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="subheadline">Subtítulo</Label>
                <Textarea id="subheadline" name="subheadline" defaultValue={page.subheadline} rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="ctaText">Texto do CTA</Label>
                    <Input id="ctaText" name="ctaText" defaultValue={page.ctaText} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="chatbotName">Nome do Bot</Label>
                    <Input id="chatbotName" name="chatbotName" defaultValue={page.chatbotName} />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="chatbotWelcomeMessage">Mensagem de Boas-vindas</Label>
                <Textarea id="chatbotWelcomeMessage" name="chatbotWelcomeMessage" defaultValue={page.chatbotWelcomeMessage} rows={2} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="chatbotSystemPrompt">Instruções do Bot</Label>
                <Textarea id="chatbotSystemPrompt" name="chatbotSystemPrompt" defaultValue={page.chatbotSystemPrompt} rows={4} />
            </div>

            {/* Design System */}
            <div className="space-y-3 pt-2 border-t border-border">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: designSystem.palette.primary }} />
                    Design System
                </h3>
                <DesignSystemPicker value={designSystem} onChange={setDesignSystem} />
            </div>

            {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
            )}
            {state.success && (
                <p className="text-sm text-[hsl(var(--success))]">Salvo com sucesso!</p>
            )}

            <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
        </form>
    )
}

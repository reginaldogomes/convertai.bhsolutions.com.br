'use client'

import { useActionState } from 'react'
import { updateLandingPage } from '@/actions/landing-pages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DesignSystemPicker } from '@/components/crm/DesignSystemPicker'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DesignSystem } from '@/domain/value-objects/design-system'
import { DEFAULT_DESIGN_SYSTEM, designSystemFromPrimaryColor } from '@/domain/value-objects/design-system'
import { Sparkles } from 'lucide-react'

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
        seoTitle?: string
        seoDescription?: string
        seoKeywords?: string[]
        seoOgTitle?: string
        seoOgDescription?: string
        seoOgImageUrl?: string
        seoCanonicalUrl?: string
        theme: string
        primaryColor: string
        designSystem?: DesignSystem
    }
}

export function LandingPageEditor({ page }: LandingPageEditorProps) {
    const initialDesignSystem = page.designSystem
        ?? designSystemFromPrimaryColor(page.primaryColor, page.theme as 'light' | 'dark')
    const initialDesignSystemSnapshot = useMemo(() => JSON.stringify(initialDesignSystem), [initialDesignSystem])

    const [designSystem, setDesignSystem] = useState<DesignSystem>(initialDesignSystem)
    const [designSystemAlert, setDesignSystemAlert] = useState('')
    const [isGeneratingSeo, setIsGeneratingSeo] = useState(false)

    const [seoTitle, setSeoTitle] = useState(page.seoTitle || '')
    const [seoDescription, setSeoDescription] = useState(page.seoDescription || '')
    const [seoKeywords, setSeoKeywords] = useState((page.seoKeywords ?? []).join(', '))
    const [seoOgTitle, setSeoOgTitle] = useState(page.seoOgTitle || '')
    const [seoOgDescription, setSeoOgDescription] = useState(page.seoOgDescription || '')
    const [seoOgImageUrl, setSeoOgImageUrl] = useState(page.seoOgImageUrl || '')
    const [seoCanonicalUrl, setSeoCanonicalUrl] = useState(page.seoCanonicalUrl || '')

    const boundAction = useCallback(
        (state: { error: string; success: boolean }, formData: FormData) =>
            updateLandingPage(page.id, state, formData),
        [page.id]
    )

    const [state, action, isPending] = useActionState(boundAction, { error: '', success: false })

    const hasUnsavedDesignSystemChanges = useMemo(
        () => JSON.stringify(designSystem) !== initialDesignSystemSnapshot,
        [designSystem, initialDesignSystemSnapshot]
    )

    const handleDesignSystemChange = useCallback((next: DesignSystem) => {
        setDesignSystem(next)
        setDesignSystemAlert('Tema alterado. Clique em "Salvar Design System" para aplicar permanentemente.')
    }, [])

    useEffect(() => {
        if (state.success) {
            setDesignSystemAlert('Design System salvo com sucesso.')
        }
    }, [state.success])

    const handleGenerateSeo = useCallback(async () => {
        setIsGeneratingSeo(true)
        setDesignSystemAlert('Gerando metatags SEO com IA...')

        try {
            const response = await fetch('/api/landing-pages/seo/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId: page.id }),
            })

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Falha ao gerar SEO com IA' }))
                throw new Error(error.error || 'Falha ao gerar SEO com IA')
            }

            const data = await response.json() as {
                title: string
                description: string
                keywords: string[]
                ogTitle: string
                ogDescription: string
            }

            setSeoTitle(data.title || '')
            setSeoDescription(data.description || '')
            setSeoKeywords(Array.isArray(data.keywords) ? data.keywords.join(', ') : '')
            setSeoOgTitle(data.ogTitle || '')
            setSeoOgDescription(data.ogDescription || '')

            setDesignSystemAlert('SEO gerado com IA. Revise e salve as alterações.')
        } catch (error) {
            setDesignSystemAlert(error instanceof Error ? error.message : 'Erro ao gerar SEO com IA')
        } finally {
            setIsGeneratingSeo(false)
        }
    }, [page.id])

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

            {/* SEO */}
            <div className="space-y-4 pt-2 border-t border-border">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">SEO & Metatags</h3>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateSeo}
                        disabled={isGeneratingSeo}
                        className="gap-2"
                    >
                        <Sparkles className="w-4 h-4" />
                        {isGeneratingSeo ? 'Gerando...' : 'Gerar SEO com IA'}
                    </Button>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="seoTitle">Meta Title</Label>
                    <Input
                        id="seoTitle"
                        name="seoTitle"
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        maxLength={70}
                        placeholder="Titulo SEO (ideal 50-65 caracteres)"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="seoDescription">Meta Description</Label>
                    <Textarea
                        id="seoDescription"
                        name="seoDescription"
                        value={seoDescription}
                        onChange={(e) => setSeoDescription(e.target.value)}
                        rows={3}
                        maxLength={170}
                        placeholder="Descricao SEO (ideal 140-160 caracteres)"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="seoKeywords">Keywords (separadas por virgula)</Label>
                    <Input
                        id="seoKeywords"
                        name="seoKeywords"
                        value={seoKeywords}
                        onChange={(e) => setSeoKeywords(e.target.value)}
                        placeholder="crm, automacao, ia para vendas"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="seoOgTitle">Open Graph Title</Label>
                        <Input
                            id="seoOgTitle"
                            name="seoOgTitle"
                            value={seoOgTitle}
                            onChange={(e) => setSeoOgTitle(e.target.value)}
                            maxLength={70}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="seoCanonicalUrl">Canonical URL</Label>
                        <Input
                            id="seoCanonicalUrl"
                            name="seoCanonicalUrl"
                            value={seoCanonicalUrl}
                            onChange={(e) => setSeoCanonicalUrl(e.target.value)}
                            placeholder="https://seu-dominio.com/p/sua-pagina"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="seoOgDescription">Open Graph Description</Label>
                    <Textarea
                        id="seoOgDescription"
                        name="seoOgDescription"
                        value={seoOgDescription}
                        onChange={(e) => setSeoOgDescription(e.target.value)}
                        rows={3}
                        maxLength={200}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="seoOgImageUrl">Open Graph Image URL</Label>
                    <Input
                        id="seoOgImageUrl"
                        name="seoOgImageUrl"
                        value={seoOgImageUrl}
                        onChange={(e) => setSeoOgImageUrl(e.target.value)}
                        placeholder="https://.../imagem-og.jpg"
                    />
                </div>
            </div>

            {/* Design System */}
            <div className="space-y-3 pt-2 border-t border-border">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: designSystem.palette.primary }} />
                    Design System
                </h3>

                {designSystemAlert && (
                    <div className={`text-xs rounded-md px-3 py-2 border ${
                        hasUnsavedDesignSystemChanges
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))] border-[hsl(var(--success))]/30'
                    }`}>
                        {designSystemAlert}
                    </div>
                )}

                <DesignSystemPicker value={designSystem} onChange={handleDesignSystemChange} />

                <div className="flex items-center gap-2">
                    <Button
                        type="submit"
                        variant={hasUnsavedDesignSystemChanges ? 'default' : 'outline'}
                        disabled={isPending || !hasUnsavedDesignSystemChanges}
                    >
                        {isPending ? 'Salvando...' : 'Salvar Design System'}
                    </Button>
                    {hasUnsavedDesignSystemChanges && (
                        <span className="text-xs text-muted-foreground">Existem mudanças de tema pendentes.</span>
                    )}
                </div>
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

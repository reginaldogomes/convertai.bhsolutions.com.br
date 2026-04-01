'use client'

import { useState } from 'react'
import type {
    LandingPageSection, SectionType, SectionContentMap,
    HeroContent, FeaturesContent, TestimonialsContent, FaqContent,
    PricingContent, ContactFormContent, CtaBannerContent, VideoContent,
    StatsContent,
} from '@/domain/entities'
import { DEFAULT_SECTION_CONTENT, SECTION_LABELS } from '@/domain/entities'
import { HeroEditor } from './editors/HeroEditor'
import { FeaturesEditor } from './editors/FeaturesEditor'
import { TestimonialsEditor } from './editors/TestimonialsEditor'
import { FaqEditor } from './editors/FaqEditor'
import { PricingEditor } from './editors/PricingEditor'
import { ContactFormEditor } from './editors/ContactFormEditor'
import { CtaBannerEditor } from './editors/CtaBannerEditor'
import { VideoEditor } from './editors/VideoEditor'
import { StatsEditor } from './editors/StatsEditor'
import { GenericEditor } from './editors/GenericEditor'
import {
    Plus, GripVertical, ChevronDown, ChevronUp, Trash2, Eye, EyeOff, Save, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateLandingPageSections } from '@/actions/landing-pages'
import { GenerateSectionsAI } from './GenerateSectionsAI'

interface SectionManagerProps {
    pageId: string
    initialSections: LandingPageSection[]
}

export function SectionManager({ pageId, initialSections }: SectionManagerProps) {
    const [sections, setSections] = useState<LandingPageSection[]>(
        () => [...initialSections].sort((a, b) => a.order - b.order)
    )
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [dirty, setDirty] = useState(false)
    const [showAddMenu, setShowAddMenu] = useState(false)

    const markDirty = () => setDirty(true)

    const addSection = (type: SectionType) => {
        const newSection: LandingPageSection = {
            id: crypto.randomUUID(),
            type,
            order: sections.length,
            visible: true,
            content: { ...DEFAULT_SECTION_CONTENT[type] } as SectionContentMap[typeof type],
        }
        setSections(prev => [...prev, newSection])
        setExpandedId(newSection.id)
        setShowAddMenu(false)
        markDirty()
    }

    const removeSection = (id: string) => {
        setSections(prev => {
            const filtered = prev.filter(s => s.id !== id)
            return filtered.map((s, i) => ({ ...s, order: i }))
        })
        if (expandedId === id) setExpandedId(null)
        markDirty()
    }

    const moveSection = (id: string, direction: 'up' | 'down') => {
        setSections(prev => {
            const idx = prev.findIndex(s => s.id === id)
            if (idx < 0) return prev
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1
            if (targetIdx < 0 || targetIdx >= prev.length) return prev
            const next = [...prev]
            ;[next[idx], next[targetIdx]] = [next[targetIdx], next[idx]]
            return next.map((s, i) => ({ ...s, order: i }))
        })
        markDirty()
    }

    const toggleVisibility = (id: string) => {
        setSections(prev =>
            prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s)
        )
        markDirty()
    }

    const updateSectionContent = (id: string, content: SectionContentMap[SectionType]) => {
        setSections(prev =>
            prev.map(s => s.id === id ? { ...s, content } : s)
        )
        markDirty()
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await updateLandingPageSections(pageId, sections)
            setDirty(false)
        } catch {
            // error handling could be improved
        } finally {
            setSaving(false)
        }
    }

    const handleAIGenerated = (newSections: LandingPageSection[]) => {
        setSections(newSections.sort((a, b) => a.order - b.order))
        setExpandedId(null)
        markDirty()
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Seções da Página</h2>
                <div className="flex items-center gap-2">
                    {dirty && (
                        <span className="text-xs text-muted-foreground">Alterações não salvas</span>
                    )}
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving || !dirty}
                    >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Seções
                    </Button>
                </div>
            </div>

            {sections.length === 0 && (
                <div className="text-center py-12 bg-[hsl(var(--secondary-subtle))] rounded-lg border border-dashed border-border">
                    <p className="text-muted-foreground text-sm mb-2">Nenhuma seção adicionada.</p>
                    <p className="text-xs text-muted-foreground">Adicione seções para personalizar sua landing page.</p>
                </div>
            )}

            <div className="space-y-2">
                {sections.map((section, idx) => (
                    <div
                        key={section.id}
                        className={`border rounded-lg ${
                            expandedId === section.id ? 'border-primary bg-card' : 'border-border bg-card'
                        } ${!section.visible ? 'opacity-60' : ''}`}
                    >
                        {/* Section Header */}
                        <div className="flex items-center gap-2 px-3 py-2.5">
                            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-xs font-mono text-muted-foreground w-6">{idx + 1}</span>
                            <button
                                onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}
                                className="flex-1 text-left text-sm font-medium truncate"
                            >
                                {SECTION_LABELS[section.type]}
                            </button>
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => toggleVisibility(section.id)} className="p-1 rounded hover:bg-secondary" title={section.visible ? 'Ocultar' : 'Mostrar'}>
                                    {section.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                                </button>
                                <button onClick={() => moveSection(section.id, 'up')} disabled={idx === 0} className="p-1 rounded hover:bg-secondary disabled:opacity-30">
                                    <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => moveSection(section.id, 'down')} disabled={idx === sections.length - 1} className="p-1 rounded hover:bg-secondary disabled:opacity-30">
                                    <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => removeSection(section.id)} className="p-1 rounded hover:bg-[hsl(var(--destructive-subtle))] text-destructive">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Section Editor (expanded) */}
                        {expandedId === section.id && (
                            <div className="border-t border-border px-4 py-4">
                                <SectionContentEditor
                                    type={section.type}
                                    content={section.content}
                                    onChange={(c) => updateSectionContent(section.id, c)}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Section */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setShowAddMenu(!showAddMenu)}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Seção
                    </Button>
                    {showAddMenu && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-card border border-border rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto">
                            {(Object.keys(SECTION_LABELS) as SectionType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => addSection(type)}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors"
                                >
                                    {SECTION_LABELS[type]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <GenerateSectionsAI onGenerated={handleAIGenerated} />
            </div>
        </div>
    )
}

function SectionContentEditor({
    type,
    content,
    onChange,
}: {
    type: SectionType
    content: SectionContentMap[SectionType]
    onChange: (c: SectionContentMap[SectionType]) => void
}) {
    switch (type) {
        case 'hero': return <HeroEditor content={content as HeroContent} onChange={onChange} />
        case 'features': return <FeaturesEditor content={content as FeaturesContent} onChange={onChange} />
        case 'testimonials': return <TestimonialsEditor content={content as TestimonialsContent} onChange={onChange} />
        case 'faq': return <FaqEditor content={content as FaqContent} onChange={onChange} />
        case 'pricing': return <PricingEditor content={content as PricingContent} onChange={onChange} />
        case 'contact_form': return <ContactFormEditor content={content as ContactFormContent} onChange={onChange} />
        case 'cta_banner': return <CtaBannerEditor content={content as CtaBannerContent} onChange={onChange} />
        case 'video': return <VideoEditor content={content as VideoContent} onChange={onChange} />
        case 'stats': return <StatsEditor content={content as StatsContent} onChange={onChange} />
        default: return <GenericEditor content={content} onChange={onChange} />
    }
}

'use client'

import { useState, useCallback, useEffect } from 'react'
import { Check, Palette, Sliders, Sparkles, ChevronDown, RotateCcw, Trash2, Save, Moon, Sun, BookmarkPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { DesignSystem, ColorPalette, FontFamily, BorderRadius, DesignStyle, DesignPreset } from '@/domain/value-objects/design-system'
import { DESIGN_PRESETS, DEFAULT_DESIGN_SYSTEM, snapPaletteToMode, detectPaletteMode } from '@/domain/value-objects/design-system'
import { cn } from '@/lib/utils'

// ─── Custom Presets (localStorage) ───────────────────────────────────────────

const STORAGE_KEY = 'convertai_custom_palettes_v1'

function loadCustomPresets(): DesignPreset[] {
    if (typeof window === 'undefined') return []
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw)return[]
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed))return[]
        return parsed as DesignPreset[]
    } catch {
        return []
    }
}

function persistCustomPresets(presets: DesignPreset[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
    } catch {
        /* localStorage unavailable */
    }
}

function useCustomPresets() {
    const [presets, setPresets] = useState<DesignPreset[]>([])

    useEffect(() => {
        setPresets(loadCustomPresets())
    }, [])

    const add = useCallback((preset: DesignPreset) => {
        setPresets(prev => {
            const next = [...prev, preset]
            persistCustomPresets(next)
            return next
        })
    }, [])

    const remove = useCallback((id: string) => {
        setPresets(prev => {
            const next = prev.filter(p => p.id !== id)
            persistCustomPresets(next)
            return next
        })
    }, [])

    return { presets, add, remove }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DesignSystemPickerProps {
    value: DesignSystem
    onChange: (ds: DesignSystem) => void
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function DesignSystemPicker({ value, onChange }: DesignSystemPickerProps) {
    const [tab, setTab] = useState<'presets' | 'custom'>('presets')
    const [expandedPreset, setExpandedPreset] = useState<string | null>(value.presetId ?? null)
    const { presets: customPresets, add: addCustomPreset, remove: removeCustomPreset } = useCustomPresets()

    const allPresets = [...DESIGN_PRESETS, ...customPresets]
    const activePresetName = allPresets.find(p => p.id === value.presetId)?.name

    const handlePresetSelect = useCallback((presetId: string, all: DesignPreset[]) => {
        const preset = all.find(p => p.id === presetId)
        if (!preset)return
        onChange({ ...preset.designSystem, presetId })
        setExpandedPreset(presetId)
    }, [onChange])

    const handleColorChange = useCallback((key: keyof ColorPalette, color: string) => {
        onChange({ ...value, presetId: undefined, palette: { ...value.palette, [key]: color } })
    }, [value, onChange])

    const handleFontChange = useCallback((fontFamily: FontFamily) => {
        onChange({ ...value, fontFamily })
    }, [value, onChange])

    const handleRadiusChange = useCallback((borderRadius: BorderRadius) => {
        onChange({ ...value, borderRadius })
    }, [value, onChange])

    const handleStyleChange = useCallback((style: DesignStyle) => {
        onChange({ ...value, style })
    }, [value, onChange])

    const handleModeToggle = useCallback((mode: 'dark' | 'light') => {
        onChange({ ...value, presetId: undefined, palette: snapPaletteToMode(value.palette, mode) })
    }, [value, onChange])

    const handleSaveAs = useCallback((name: string) => {
        const id = `custom-${Date.now()}`
        const newPreset: DesignPreset = {
            id,
            name,
            description: 'Paleta personalizada',
            tags: ['custom'],
            designSystem: { ...value, presetId: undefined },
        }
        addCustomPreset(newPreset)
        onChange({ ...value, presetId: id })
        setTab('presets')
        setExpandedPreset(id)
    }, [value, addCustomPreset, onChange])

    const handleDeleteCustom = useCallback((id: string) => {
        removeCustomPreset(id)
        if (value.presetId === id) {
            onChange({ ...value, presetId: undefined })
        }
    }, [removeCustomPreset, value, onChange])

    return (
        <div className="space-y-4">
            {/* Tab Switcher */}
            <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
                <button
                    type="button"
                    onClick={() => setTab('presets')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
                        tab === 'presets'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <Sparkles className="w-4 h-4" />
                    Paletas Prontas
                </button>
                <button
                    type="button"
                    onClick={() => setTab('custom')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
                        tab === 'custom'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <Sliders className="w-4 h-4" />
                    Personalizar
                </button>
            </div>

            {/* Active Palette Preview */}
            <div className="p-3 rounded-lg border border-border bg-secondary/30">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Paleta Atual
                    </span>
                    <div className="flex items-center gap-2">
                        {activePresetName && (
                            <span className="text-xs text-muted-foreground">{activePresetName}</span>
                        )}
                        <PaletteModeTag palette={value.palette} />
                    </div>
                </div>
                <PaletteSwatches palette={value.palette} size="lg" />
            </div>

            {/* Content */}
            {tab === 'presets' ? (
                <PresetGallery
                    selectedId={value.presetId}
                    expandedId={expandedPreset}
                    builtinPresets={DESIGN_PRESETS}
                    customPresets={customPresets}
                    onSelect={(id) => handlePresetSelect(id, [...DESIGN_PRESETS, ...customPresets])}
                    onToggleExpand={setExpandedPreset}
                    onDeleteCustom={handleDeleteCustom}
                />
            ) : (
                <CustomEditor
                    value={value}
                    onColorChange={handleColorChange}
                    onFontChange={handleFontChange}
                    onRadiusChange={handleRadiusChange}
                    onStyleChange={handleStyleChange}
                    onReset={() => onChange(DEFAULT_DESIGN_SYSTEM)}
                    onModeToggle={handleModeToggle}
                    onSaveAs={handleSaveAs}
                />
            )}

            {/* Hidden input for form serialization */}
            <input type="hidden" name="designSystem" value={JSON.stringify(value)} />
        </div>
    )
}

// ─── Palette Mode Tag ─────────────────────────────────────────────────────────

function PaletteModeTag({ palette }: { palette: ColorPalette }) {
    const mode = detectPaletteMode(palette)
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                mode === 'dark'
                    ? 'bg-slate-800 text-slate-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
            )}
        >
            {mode === 'dark' ? <Moon className="w-2.5 h-2.5" /> : <Sun className="w-2.5 h-2.5" />}
            {mode === 'dark' ? 'Dark' : 'Light'}
        </span>
    )
}

// ─── Palette Swatches ─────────────────────────────────────────────────────────

function PaletteSwatches({ palette, size = 'md' }: { palette: ColorPalette; size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = { sm: 'h-5 w-5', md: 'h-7 w-7', lg: 'h-9 flex-1' }
    const colors: { key: keyof ColorPalette; label: string }[] = [
        { key: 'primary', label: 'Principal' },
        { key: 'secondary', label: 'Secundária' },
        { key: 'accent', label: 'Destaque' },
        { key: 'background', label: 'Fundo' },
        { key: 'foreground', label: 'Texto' },
        { key: 'muted', label: 'Suave' },
    ]
    return (
        <div className={cn('flex gap-1.5', size === 'lg' && 'gap-2')}>
            {colors.map(({ key, label }) => (
                <div key={key} className="group/swatch relative">
                    <div
                        className={cn('rounded-md border border-border/50 transition-transform group-hover/swatch:scale-110', sizeClasses[size])}
                        style={{ backgroundColor: palette[key] }}
                        title={`${label}: ${palette[key]}`}
                    />
                    {size === 'lg' && (
                        <span className="block text-center text-[10px] text-muted-foreground mt-1">{label}</span>
                    )}
                </div>
            ))}
        </div>
    )
}

// ─── Mini Preview Card ────────────────────────────────────────────────────────

function MiniPreviewCard({ ds }: { ds: DesignSystem }) {
    const p = ds.palette
    return (
        <div
            className="w-full h-16 rounded-xl overflow-hidden border border-border/40 relative flex items-center justify-center"
            style={{ backgroundColor: p.background }}
        >
            <div
                className="absolute inset-0 opacity-10"
                style={{ background: `radial-gradient(ellipse at 30% 50%, ${p.primary}, transparent 70%)` }}
            />
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: p.primary }} />
            <div className="relative flex flex-col gap-1 items-center">
                <div className="h-1.25 w-24 rounded-full" style={{ backgroundColor: p.foreground, opacity: 0.75 }} />
                <div className="h-0.75 w-16 rounded-full" style={{ backgroundColor: p.muted, opacity: 0.6 }} />
                <div className="h-1.5 w-10 rounded-full mt-1" style={{ backgroundColor: p.accent }} />
            </div>
            <div
                className="absolute right-3 top-3 bottom-3 w-10 rounded-lg opacity-30"
                style={{ backgroundColor: p.secondary }}
            />
        </div>
    )
}

// ─── Preset Gallery ──────────────────────────────────────────────────────────

function PresetGallery({
    selectedId,
    expandedId,
    builtinPresets,
    customPresets,
    onSelect,
    onToggleExpand,
    onDeleteCustom,
}: {
    selectedId?: string
    expandedId: string | null
    builtinPresets: DesignPreset[]
    customPresets: DesignPreset[]
    onSelect: (id: string) => void
    onToggleExpand: (id: string | null) => void
    onDeleteCustom: (id: string) => void
}) {
    return (
        <div className="space-y-4">
            {customPresets.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Minhas Paletas ({customPresets.length})
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                        {customPresets.map(preset => (
                            <PresetRow
                                key={preset.id}
                                preset={preset}
                                isSelected={selectedId === preset.id}
                                isExpanded={expandedId === preset.id}
                                isCustom
                                onSelect={onSelect}
                                onToggleExpand={onToggleExpand}
                                onDelete={onDeleteCustom}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div>
                {customPresets.length > 0 && (
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Paletas do Sistema
                    </p>
                )}
                <div className="grid grid-cols-1 gap-2">
                    {builtinPresets.map(preset => (
                        <PresetRow
                            key={preset.id}
                            preset={preset}
                            isSelected={selectedId === preset.id}
                            isExpanded={expandedId === preset.id}
                            isCustom={false}
                            onSelect={onSelect}
                            onToggleExpand={onToggleExpand}
                            onDelete={() => {}}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

function PresetRow({
    preset,
    isSelected,
    isExpanded,
    isCustom,
    onSelect,
    onToggleExpand,
    onDelete,
}: {
    preset: DesignPreset
    isSelected: boolean
    isExpanded: boolean
    isCustom: boolean
    onSelect: (id: string) => void
    onToggleExpand: (id: string | null) => void
    onDelete: (id: string) => void
}) {
    const p = preset.designSystem.palette
    return (
        <div
            className={cn(
                'group relative rounded-lg border transition-all',
                isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border hover:border-primary/30 hover:bg-secondary/30'
            )}
        >
            <button
                type="button"
                onClick={() => onSelect(preset.id)}
                className="w-full text-left p-3 pr-20"
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-12 h-12 rounded-lg shrink-0 relative overflow-hidden border border-border/30"
                        style={{ backgroundColor: p.background }}
                    >
                        <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ backgroundColor: p.primary }} />
                        <div className="absolute top-2 left-2 w-5 h-1 rounded-full" style={{ backgroundColor: p.foreground, opacity: 0.7 }} />
                        <div className="absolute top-4.5 left-2 w-3 h-0.5 rounded-full" style={{ backgroundColor: p.muted, opacity: 0.5 }} />
                        <div className="absolute top-7 left-2 w-4 h-2 rounded-sm" style={{ backgroundColor: p.accent }} />
                        {isCustom && (
                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-violet-400" title="Paleta personalizada" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{preset.name}</span>
                            {isSelected && (
                                <span className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-primary">
                                    <Check className="w-3 h-3 text-primary-foreground" />
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{preset.description}</p>
                    </div>
                    <PaletteSwatches palette={p} size="sm" />
                </div>
            </button>

            <div className="absolute top-3 right-3 flex items-center gap-1">
                {isCustom && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(`Excluir a paleta "${preset.name}"?`)) onDelete(preset.id)
                        }}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                        title="Excluir paleta"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
                {isSelected && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onToggleExpand(isExpanded ? null : preset.id)
                        }}
                        className="p-1 rounded hover:bg-secondary/50"
                    >
                        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
                    </button>
                )}
            </div>

            {isExpanded && (
                <div className="px-3 pb-3 pt-0 border-t border-border/50">
                    <div className="pt-3 space-y-3">
                        <MiniPreviewCard ds={preset.designSystem} />
                        <div className="flex flex-wrap gap-1">
                            {preset.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-secondary text-xs rounded-full text-muted-foreground">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                            <div>
                                <span className="block text-foreground font-medium">{FONT_LABELS[preset.designSystem.fontFamily]}</span>
                                Fonte
                            </div>
                            <div>
                                <span className="block text-foreground font-medium">{RADIUS_LABELS[preset.designSystem.borderRadius]}</span>
                                Bordas
                            </div>
                            <div>
                                <span className="block text-foreground font-medium">{STYLE_LABELS[preset.designSystem.style]}</span>
                                Estilo
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Custom Editor ────────────────────────────────────────────────────────────

function CustomEditor({
    value,
    onColorChange,
    onFontChange,
    onRadiusChange,
    onStyleChange,
    onReset,
    onModeToggle,
    onSaveAs,
}: {
    value: DesignSystem
    onColorChange: (key: keyof ColorPalette, color: string) => void
    onFontChange: (font: FontFamily) => void
    onRadiusChange: (radius: BorderRadius) => void
    onStyleChange: (style: DesignStyle) => void
    onReset: () => void
    onModeToggle: (mode: 'dark' | 'light') => void
    onSaveAs: (name: string) => void
}) {
    const [saveAsName, setSaveAsName] = useState('')
    const [showSaveAs, setShowSaveAs] = useState(false)
    const currentMode = detectPaletteMode(value.palette)

    const handleSaveSubmit = () => {
        const name = saveAsName.trim()
        if (!name) return
        onSaveAs(name)
        setSaveAsName('')
        setShowSaveAs(false)
    }

    return (
        <div className="space-y-5">
            {/* Live preview */}
            <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Pré-visualização</p>
                <MiniPreviewCard ds={value} />
            </div>

            {/* Dark / Light mode quick switch */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Modo Claro / Escuro</Label>
                    <span className="text-xs text-muted-foreground">Fundo e texto automáticos</span>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => onModeToggle('light')}
                        className={cn(
                            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all',
                            currentMode === 'light'
                                ? 'border-amber-400 bg-amber-50 text-amber-700 ring-1 ring-amber-300'
                                : 'border-border hover:border-amber-300 hover:bg-amber-50/50 text-muted-foreground hover:text-amber-700'
                        )}
                    >
                        <Sun className="w-4 h-4" />
                        Modo Claro
                    </button>
                    <button
                        type="button"
                        onClick={() => onModeToggle('dark')}
                        className={cn(
                            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all',
                            currentMode === 'dark'
                                ? 'border-slate-600 bg-slate-900 text-slate-200 ring-1 ring-slate-600'
                                : 'border-border hover:border-slate-500 hover:bg-slate-900/10 text-muted-foreground hover:text-slate-700'
                        )}
                    >
                        <Moon className="w-4 h-4" />
                        Modo Escuro
                    </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                    Modo Claro: fundo branco, texto escuro · Modo Escuro: fundo #0f0f1a, texto claro
                </p>
            </div>

            {/* Chromatic colors */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Cores Cromáticas
                    </h4>
                    <Button type="button" variant="ghost" size="sm" onClick={onReset} className="h-7 text-xs">
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Resetar
                    </Button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    {CHROMATIC_FIELDS.map(({ key, label, description }) => (
                        <ColorInput
                            key={key}
                            label={label}
                            description={description}
                            value={value.palette[key]}
                            onChange={(c) => onColorChange(key, c)}
                        />
                    ))}
                </div>
            </div>

            {/* Base colors */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                        <Palette className="w-4 h-4 opacity-60" />
                        Cores de Base
                    </h4>
                    <span className="text-[10px] text-muted-foreground">ou use os botões acima</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    {BASE_FIELDS.map(({ key, label, description }) => (
                        <ColorInput
                            key={key}
                            label={label}
                            description={description}
                            value={value.palette[key]}
                            onChange={(c) => onColorChange(key, c)}
                        />
                    ))}
                </div>
            </div>

            {/* Font Family */}
            <div>
                <Label className="text-sm font-medium mb-2 block">Família da Fonte</Label>
                <div className="grid grid-cols-3 gap-2">
                    {FONT_OPTIONS.map(({ value: fontValue, label, preview }) => (
                        <button
                            key={fontValue}
                            type="button"
                            onClick={() => onFontChange(fontValue)}
                            className={cn(
                                'p-2 rounded-lg border text-center transition-all',
                                value.fontFamily === fontValue
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                    : 'border-border hover:border-primary/30'
                            )}
                        >
                            <span className="block text-lg leading-none" style={{ fontFamily: preview }}>Aa</span>
                            <span className="block text-[10px] mt-1 text-muted-foreground">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Border Radius */}
            <div>
                <Label className="text-sm font-medium mb-2 block">Arredondamento</Label>
                <div className="flex gap-2">
                    {RADIUS_OPTIONS.map(({ value: radiusValue, label, preview }) => (
                        <button
                            key={radiusValue}
                            type="button"
                            onClick={() => onRadiusChange(radiusValue)}
                            className={cn(
                                'flex-1 p-2 border text-center transition-all',
                                value.borderRadius === radiusValue
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                    : 'border-border hover:border-primary/30',
                                preview
                            )}
                        >
                            <span className="text-xs text-muted-foreground">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Style */}
            <div>
                <Label className="text-sm font-medium mb-2 block">Estilo Visual</Label>
                <div className="grid grid-cols-3 gap-2">
                    {STYLE_OPTIONS.map(({ value: styleValue, label, emoji }) => (
                        <button
                            key={styleValue}
                            type="button"
                            onClick={() => onStyleChange(styleValue)}
                            className={cn(
                                'p-2 rounded-lg border text-center transition-all',
                                value.style === styleValue
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                    : 'border-border hover:border-primary/30'
                            )}
                        >
                            <span className="block text-base">{emoji}</span>
                            <span className="block text-[10px] mt-0.5 text-muted-foreground">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Save As */}
            <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
                {!showSaveAs?(
                    <button
                        type="button"
                        onClick={() => setShowSaveAs(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <BookmarkPlus className="w-4 h-4" />
                        Salvar como paleta personalizada
                    </button>
                ) : (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-foreground">Nome da paleta</p>
                        <div className="flex gap-2">
                            <Input
                                value={saveAsName}
                                onChange={e => setSaveAsName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSaveSubmit()}
                                placeholder="Ex: Minha marca — Azul"
                                className="h-8 text-xs bg-background flex-1"
                                autoFocus
                                maxLength={50}
                            />
                            <Button
                                type="button"
                                size="sm"
                                className="h-8 px-3 text-xs"
                                disabled={!saveAsName.trim()}
                                onClick={handleSaveSubmit}
                            >
                                <Save className="w-3.5 h-3.5 mr-1" />
                                Salvar
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs"
                                onClick={() => { setShowSaveAs(false); setSaveAsName('') }}
                            >
                                Cancelar
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            A paleta ficará disponível em "Paletas Prontas" neste navegador.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Color Input ──────────────────────────────────────────────────────────────

function ColorInput({ label, description, value, onChange }: {
    label: string
    description: string
    value: string
    onChange: (color: string) => void
}) {
    return (
        <div className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-secondary/20">
            <div className="relative shrink-0">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                    className="w-8 h-8 rounded-md border border-border/50 shadow-sm"
                    style={{ backgroundColor: value }}
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-none">{label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => {
                    const v = e.target.value
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v)
                }}
                className="w-18 text-xs font-mono bg-transparent border border-border/50 rounded px-1.5 py-1 text-center"
                maxLength={7}
            />
        </div>
    )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHROMATIC_FIELDS: { key: keyof ColorPalette; label: string; description: string }[] = [
    { key: 'primary', label: 'Principal', description: 'Botões, links e elementos de destaque' },
    { key: 'secondary', label: 'Secundária', description: 'Elementos de apoio e hover states' },
    { key: 'accent', label: 'Destaque (Accent)', description: 'Badges, kickers e ícones de destaque' },
]

const BASE_FIELDS: { key: keyof ColorPalette; label: string; description: string }[] = [
    { key: 'background', label: 'Fundo', description: 'Cor de fundo da página inteira' },
    { key: 'foreground', label: 'Texto', description: 'Cor principal do texto' },
    { key: 'muted', label: 'Suave', description: 'Textos e ícones secundários' },
]

const FONT_OPTIONS: { value: FontFamily; label: string; preview: string }[] = [
    { value: 'inter', label: 'Inter', preview: 'Inter, sans-serif' },
    { value: 'poppins', label: 'Poppins', preview: 'Poppins, sans-serif' },
    { value: 'dm-sans', label: 'DM Sans', preview: '"DM Sans", sans-serif' },
    { value: 'space-grotesk', label: 'Space Grotesk', preview: '"Space Grotesk", sans-serif' },
    { value: 'playfair', label: 'Playfair', preview: '"Playfair Display", serif' },
]

const FONT_LABELS: Record<FontFamily, string> = {
    'inter': 'Inter',
    'poppins': 'Poppins',
    'dm-sans': 'DM Sans',
    'space-grotesk': 'Space Grotesk',
    'playfair': 'Playfair',
}

const RADIUS_OPTIONS: { value: BorderRadius; label: string; preview: string }[] = [
    { value: 'none', label: 'Reto', preview: 'rounded-none' },
    { value: 'sm', label: 'Sutil', preview: 'rounded-sm' },
    { value: 'md', label: 'Médio', preview: 'rounded-md' },
    { value: 'lg', label: 'Grande', preview: 'rounded-lg' },
    { value: 'full', label: 'Pílula', preview: 'rounded-full' },
]

const RADIUS_LABELS: Record<BorderRadius, string> = {
    'none': 'Reto',
    'sm': 'Sutil',
    'md': 'Médio',
    'lg': 'Grande',
    'full': 'Pílula',
}

const STYLE_OPTIONS: { value: DesignStyle; label: string; emoji: string }[] = [
    { value: 'modern', label: 'Moderno', emoji: '✨' },
    { value: 'bold', label: 'Ousado', emoji: '🔥' },
    { value: 'elegant', label: 'Elegante', emoji: '💎' },
    { value: 'minimal', label: 'Minimal', emoji: '◻️' },
    { value: 'corporate', label: 'Corporativo', emoji: '🏢' },
    { value: 'playful', label: 'Divertido', emoji: '🎨' },
]

const STYLE_LABELS: Record<DesignStyle, string> = {
    'modern': 'Moderno',
    'bold': 'Ousado',
    'elegant': 'Elegante',
    'minimal': 'Minimal',
    'corporate': 'Corporativo',
    'playful': 'Divertido',
}

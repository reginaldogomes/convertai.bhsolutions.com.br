'use client'

import { useState, useCallback } from 'react'
import { Check, Palette, Sliders, Sparkles, ChevronDown, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { DesignSystem, ColorPalette, FontFamily, BorderRadius, DesignStyle } from '@/domain/value-objects/design-system'
import { DESIGN_PRESETS, DEFAULT_DESIGN_SYSTEM, designSystemFromPrimaryColor } from '@/domain/value-objects/design-system'
import { cn } from '@/lib/utils'

interface DesignSystemPickerProps {
    value: DesignSystem
    onChange: (ds: DesignSystem) => void
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function DesignSystemPicker({ value, onChange }: DesignSystemPickerProps) {
    const [tab, setTab] = useState<'presets' | 'custom'>('presets')
    const [expandedPreset, setExpandedPreset] = useState<string | null>(value.presetId ?? null)

    const handlePresetSelect = useCallback((presetId: string) => {
        const preset = DESIGN_PRESETS.find(p => p.id === presetId)
        if (!preset) return
        onChange({ ...preset.designSystem, presetId })
        setExpandedPreset(presetId)
    }, [onChange])

    const handleColorChange = useCallback((key: keyof ColorPalette, color: string) => {
        onChange({
            ...value,
            presetId: undefined,
            palette: { ...value.palette, [key]: color },
        })
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
                    {value.presetId && (
                        <span className="text-xs text-muted-foreground">
                            {DESIGN_PRESETS.find(p => p.id === value.presetId)?.name}
                        </span>
                    )}
                </div>
                <PaletteSwatches palette={value.palette} size="lg" />
            </div>

            {/* Content */}
            {tab === 'presets' ? (
                <PresetGallery
                    selectedId={value.presetId}
                    expandedId={expandedPreset}
                    onSelect={handlePresetSelect}
                    onToggleExpand={setExpandedPreset}
                />
            ) : (
                <CustomEditor
                    value={value}
                    onColorChange={handleColorChange}
                    onFontChange={handleFontChange}
                    onRadiusChange={handleRadiusChange}
                    onStyleChange={handleStyleChange}
                    onReset={() => onChange(DEFAULT_DESIGN_SYSTEM)}
                />
            )}

            {/* Hidden inputs for form serialization */}
            <input type="hidden" name="designSystem" value={JSON.stringify(value)} />
        </div>
    )
}

// ─── Palette Swatches ─────────────────────────────────────────────────────────

function PaletteSwatches({
    palette,
    size = 'md',
}: {
    palette: ColorPalette
    size?: 'sm' | 'md' | 'lg'
}) {
    const sizeClasses = {
        sm: 'h-5 w-5',
        md: 'h-7 w-7',
        lg: 'h-9 flex-1',
    }

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
                        className={cn(
                            'rounded-md border border-border/50 transition-transform group-hover/swatch:scale-110',
                            sizeClasses[size]
                        )}
                        style={{ backgroundColor: palette[key] }}
                        title={`${label}: ${palette[key]}`}
                    />
                    {size === 'lg' && (
                        <span className="block text-center text-[10px] text-muted-foreground mt-1">
                            {label}
                        </span>
                    )}
                </div>
            ))}
        </div>
    )
}

// ─── Preset Gallery ──────────────────────────────────────────────────────────

function PresetGallery({
    selectedId,
    expandedId,
    onSelect,
    onToggleExpand,
}: {
    selectedId?: string
    expandedId: string | null
    onSelect: (id: string) => void
    onToggleExpand: (id: string | null) => void
}) {
    return (
        <div className="grid grid-cols-1 gap-2">
            {DESIGN_PRESETS.map((preset) => {
                const isSelected = selectedId === preset.id
                const isExpanded = expandedId === preset.id

                return (
                    <div
                        key={preset.id}
                        className={cn(
                            'group relative rounded-lg border transition-all cursor-pointer',
                            isSelected
                                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                : 'border-border hover:border-primary/30 hover:bg-secondary/30'
                        )}
                    >
                        <button
                            type="button"
                            onClick={() => onSelect(preset.id)}
                            className="w-full text-left p-3"
                        >
                            <div className="flex items-center gap-3">
                                {/* Mini preview card */}
                                <div
                                    className="w-12 h-12 rounded-lg flex-shrink-0 relative overflow-hidden border border-border/30"
                                    style={{ backgroundColor: preset.designSystem.palette.background }}
                                >
                                    <div
                                        className="absolute bottom-0 left-0 right-0 h-1.5"
                                        style={{ backgroundColor: preset.designSystem.palette.primary }}
                                    />
                                    <div
                                        className="absolute top-2 left-2 w-5 h-1 rounded-full"
                                        style={{ backgroundColor: preset.designSystem.palette.foreground, opacity: 0.7 }}
                                    />
                                    <div
                                        className="absolute top-4.5 left-2 w-3 h-0.5 rounded-full"
                                        style={{ backgroundColor: preset.designSystem.palette.muted, opacity: 0.5 }}
                                    />
                                    <div
                                        className="absolute top-7 left-2 w-4 h-2 rounded-sm"
                                        style={{ backgroundColor: preset.designSystem.palette.accent }}
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">{preset.name}</span>
                                        {isSelected && (
                                            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary">
                                                <Check className="w-3 h-3 text-primary-foreground" />
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                        {preset.description}
                                    </p>
                                </div>

                                <PaletteSwatches palette={preset.designSystem.palette} size="sm" />
                            </div>
                        </button>

                        {/* Expand details */}
                        {isSelected && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onToggleExpand(isExpanded ? null : preset.id)
                                }}
                                className="absolute top-3 right-3 p-1 rounded hover:bg-secondary/50"
                            >
                                <ChevronDown className={cn(
                                    'w-4 h-4 text-muted-foreground transition-transform',
                                    isExpanded && 'rotate-180'
                                )} />
                            </button>
                        )}

                        {isExpanded && (
                            <div className="px-3 pb-3 pt-0 border-t border-border/50 mt-0">
                                <div className="pt-3 space-y-2">
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
            })}
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
}: {
    value: DesignSystem
    onColorChange: (key: keyof ColorPalette, color: string) => void
    onFontChange: (font: FontFamily) => void
    onRadiusChange: (radius: BorderRadius) => void
    onStyleChange: (style: DesignStyle) => void
    onReset: () => void
}) {
    return (
        <div className="space-y-5">
            {/* Colors */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Cores da Paleta
                    </h4>
                    <Button type="button" variant="ghost" size="sm" onClick={onReset} className="h-7 text-xs">
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Resetar
                    </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {COLOR_FIELDS.map(({ key, label, description }) => (
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
        </div>
    )
}

// ─── Color Input ──────────────────────────────────────────────────────────────

function ColorInput({
    label,
    description,
    value,
    onChange,
}: {
    label: string
    description: string
    value: string
    onChange: (color: string) => void
}) {
    return (
        <div className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-secondary/20">
            <div className="relative">
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
                className="w-[72px] text-xs font-mono bg-transparent border border-border/50 rounded px-1.5 py-1 text-center"
                maxLength={7}
            />
        </div>
    )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_FIELDS: { key: keyof ColorPalette; label: string; description: string }[] = [
    { key: 'primary', label: 'Principal', description: 'Botões e links' },
    { key: 'secondary', label: 'Secundária', description: 'Elementos de apoio' },
    { key: 'accent', label: 'Destaque', description: 'Badges e destaques' },
    { key: 'background', label: 'Fundo', description: 'Cor de fundo da página' },
    { key: 'foreground', label: 'Texto', description: 'Cor principal do texto' },
    { key: 'muted', label: 'Suave', description: 'Textos secundários' },
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

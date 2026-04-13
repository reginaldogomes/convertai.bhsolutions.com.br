'use client'

import { Check } from 'lucide-react'

export type HeroLayoutPreset = 'central' | 'split' | 'immersive' | 'minimal'

export interface HeroPreset {
    id: HeroLayoutPreset
    name: string
    description: string
    layout: 'background' | 'split'
    alignment: 'center' | 'left'
    suggestBackgroundImage: boolean
}

export const HERO_PRESETS: HeroPreset[] = [
    {
        id: 'central',
        name: 'Clássico Central',
        description: 'Headline ao centro com gradiente suave, ideal para marcas modernas',
        layout: 'background',
        alignment: 'center',
        suggestBackgroundImage: false,
    },
    {
        id: 'split',
        name: 'Hero Split',
        description: 'Texto à esquerda e imagem do produto à direita, ótimo para SaaS',
        layout: 'split',
        alignment: 'left',
        suggestBackgroundImage: false,
    },
    {
        id: 'immersive',
        name: 'Fundo Imersivo',
        description: 'Texto sobre imagem de fundo em destaque total, impacto visual máximo',
        layout: 'background',
        alignment: 'center',
        suggestBackgroundImage: true,
    },
    {
        id: 'minimal',
        name: 'Minimalista',
        description: 'Layout clean alinhado à esquerda, tipografia forte sem distrações',
        layout: 'background',
        alignment: 'left',
        suggestBackgroundImage: false,
    },
]

/* ─── Visual Thumbnails ─── */

function ThumbnailCentral() {
    return (
        <div className="relative h-[68px] w-full rounded-md overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 flex flex-col items-center justify-center gap-[5px] px-3">
            {/* Gradient orb hint */}
            <div className="absolute right-3 top-1 h-10 w-10 rounded-full blur-xl opacity-40 bg-indigo-400" />
            <div className="absolute left-2 bottom-0 h-8 w-8 rounded-full blur-xl opacity-20 bg-violet-500" />
            {/* Text representation */}
            <div className="relative h-[6px] w-3/4 rounded-full bg-white/65" />
            <div className="relative h-[4px] w-1/2 rounded-full bg-white/35" />
            <div className="relative h-[5px] w-1/4 rounded bg-indigo-400/80 mt-[3px]" />
        </div>
    )
}

function ThumbnailSplit() {
    return (
        <div className="h-[68px] w-full rounded-md overflow-hidden bg-slate-900 flex">
            {/* Left — text */}
            <div className="flex-1 flex flex-col justify-center gap-[5px] px-2.5 py-2">
                <div className="h-[6px] w-4/5 rounded-full bg-white/65" />
                <div className="h-[4px] w-3/5 rounded-full bg-white/35" />
                <div className="h-[4px] w-2/5 rounded-full bg-white/20" />
                <div className="h-[5px] w-1/3 rounded bg-indigo-400/80 mt-[2px]" />
            </div>
            {/* Right — image placeholder */}
            <div className="w-[38%] bg-gradient-to-br from-indigo-800/50 to-violet-800/40 flex items-center justify-center">
                <div className="w-9 h-9 rounded-md bg-white/10 border border-white/10 flex items-center justify-center">
                    <div className="w-5 h-4 rounded-sm bg-white/20" />
                </div>
            </div>
        </div>
    )
}

function ThumbnailImmersive() {
    return (
        <div className="relative h-[68px] w-full rounded-md overflow-hidden flex flex-col items-center justify-center gap-[5px] px-3">
            {/* Background image simulation */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-800 to-purple-950" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.2)_0%,_transparent_70%)]" />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40" />
            {/* Text */}
            <div className="relative h-[6px] w-2/3 rounded-full bg-white/70" />
            <div className="relative h-[4px] w-1/2 rounded-full bg-white/45" />
            <div className="relative h-[5px] w-1/4 rounded bg-white/60 mt-[3px]" />
        </div>
    )
}

function ThumbnailMinimal() {
    return (
        <div className="h-[68px] w-full rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col justify-center gap-[5px] pl-3 pr-2 py-2">
            <div className="h-[6px] w-3/5 rounded-full bg-slate-700 dark:bg-white/65" />
            <div className="h-[4px] w-2/5 rounded-full bg-slate-400 dark:bg-white/35" />
            <div className="h-[4px] w-4/5 rounded-full bg-slate-300 dark:bg-white/20" />
            <div className="h-[5px] w-1/4 rounded bg-slate-500 dark:bg-white/40 mt-[2px]" />
        </div>
    )
}

const THUMBNAILS: Record<HeroLayoutPreset, React.FC> = {
    central:   ThumbnailCentral,
    split:     ThumbnailSplit,
    immersive: ThumbnailImmersive,
    minimal:   ThumbnailMinimal,
}

/* ─── Picker Component ─── */

interface HeroTemplatePickerProps {
    value: HeroLayoutPreset
    onChange: (preset: HeroLayoutPreset) => void
}

export function HeroTemplatePicker({ value, onChange }: HeroTemplatePickerProps) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {HERO_PRESETS.map((preset) => {
                const isSelected = value === preset.id
                const Thumbnail = THUMBNAILS[preset.id]
                return (
                    <button
                        key={preset.id}
                        type="button"
                        onClick={() => onChange(preset.id)}
                        className={`flex flex-col gap-2.5 rounded-lg border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                            isSelected
                                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                : 'border-border hover:border-primary/30 hover:bg-secondary/50'
                        }`}
                    >
                        <Thumbnail />
                        <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground">{preset.name}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                                    {preset.description}
                                </p>
                            </div>
                            {isSelected && (
                                <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            )}
                        </div>
                    </button>
                )
            })}
        </div>
    )
}

// ─── Color Palette ────────────────────────────────────────────────────────────

export interface ColorPalette {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
}

export type FontFamily = 'inter' | 'poppins' | 'dm-sans' | 'space-grotesk' | 'playfair'
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'full'
export type DesignStyle = 'modern' | 'bold' | 'elegant' | 'minimal' | 'corporate' | 'playful'

export interface DesignSystem {
    palette: ColorPalette
    presetId?: string
    fontFamily: FontFamily
    borderRadius: BorderRadius
    style: DesignStyle
}

// ─── Presets ──────────────────────────────────────────────────────────────────

export interface DesignPreset {
    id: string
    name: string
    description: string
    tags: string[]
    designSystem: DesignSystem
}

export const DESIGN_PRESETS: DesignPreset[] = [
    {
        id: 'indigo-tech',
        name: 'Indigo Tech',
        description: 'Moderno e tecnológico, perfeito para SaaS e startups',
        tags: ['tech', 'saas', 'startup'],
        designSystem: {
            palette: {
                primary: '#6366f1',
                secondary: '#818cf8',
                accent: '#f59e0b',
                background: '#0f0f23',
                foreground: '#f1f5f9',
                muted: '#64748b',
            },
            fontFamily: 'inter',
            borderRadius: 'lg',
            style: 'modern',
        },
    },
    {
        id: 'ocean-trust',
        name: 'Ocean Trust',
        description: 'Confiável e profissional, ideal para consultoria e finanças',
        tags: ['corporate', 'finance', 'consulting'],
        designSystem: {
            palette: {
                primary: '#0ea5e9',
                secondary: '#06b6d4',
                accent: '#f97316',
                background: '#fafbfc',
                foreground: '#0f172a',
                muted: '#94a3b8',
            },
            fontFamily: 'inter',
            borderRadius: 'md',
            style: 'corporate',
        },
    },
    {
        id: 'emerald-growth',
        name: 'Emerald Growth',
        description: 'Natural e fresco, ótimo para saúde, sustentabilidade e bem-estar',
        tags: ['health', 'nature', 'wellness'],
        designSystem: {
            palette: {
                primary: '#10b981',
                secondary: '#34d399',
                accent: '#8b5cf6',
                background: '#f0fdf4',
                foreground: '#064e3b',
                muted: '#6b7280',
            },
            fontFamily: 'dm-sans',
            borderRadius: 'lg',
            style: 'modern',
        },
    },
    {
        id: 'sunset-energy',
        name: 'Sunset Energy',
        description: 'Vibrante e energético, perfeito para criatividade e eventos',
        tags: ['creative', 'events', 'marketing'],
        designSystem: {
            palette: {
                primary: '#f97316',
                secondary: '#fb923c',
                accent: '#ec4899',
                background: '#fffbeb',
                foreground: '#1c1917',
                muted: '#78716c',
            },
            fontFamily: 'poppins',
            borderRadius: 'lg',
            style: 'bold',
        },
    },
    {
        id: 'urban-estate',
        name: 'Urban Estate',
        description: 'Sofisticado e confiavel, ideal para imobiliarias, construtoras e alto padrao',
        tags: ['real-estate', 'realestate', 'imobiliaria', 'imoveis', 'property', 'luxury'],
        designSystem: {
            palette: {
                primary: '#1e3a5f',
                secondary: '#2f5d8a',
                accent: '#c9a96b',
                background: '#f8f5ef',
                foreground: '#111827',
                muted: '#6b7280',
            },
            fontFamily: 'playfair',
            borderRadius: 'sm',
            style: 'elegant',
        },
    },
    {
        id: 'rose-luxury',
        name: 'Rose Luxury',
        description: 'Elegante e sofisticado, ideal para moda, beleza e lifestyle',
        tags: ['luxury', 'fashion', 'beauty'],
        designSystem: {
            palette: {
                primary: '#e11d48',
                secondary: '#f43f5e',
                accent: '#d4a574',
                background: '#fef2f2',
                foreground: '#1a0a0e',
                muted: '#a8a29e',
            },
            fontFamily: 'playfair',
            borderRadius: 'sm',
            style: 'elegant',
        },
    },
    {
        id: 'neon-pulse',
        name: 'Neon Pulse',
        description: 'Ousado e futurista, para gaming, Web3 e entretenimento',
        tags: ['gaming', 'web3', 'entertainment'],
        designSystem: {
            palette: {
                primary: '#a855f7',
                secondary: '#c084fc',
                accent: '#22d3ee',
                background: '#09090b',
                foreground: '#fafafa',
                muted: '#71717a',
            },
            fontFamily: 'space-grotesk',
            borderRadius: 'lg',
            style: 'bold',
        },
    },
    {
        id: 'slate-minimal',
        name: 'Slate Minimal',
        description: 'Limpo e minimalista, para portfólios e agências',
        tags: ['minimal', 'portfolio', 'agency'],
        designSystem: {
            palette: {
                primary: '#334155',
                secondary: '#475569',
                accent: '#0ea5e9',
                background: '#ffffff',
                foreground: '#0f172a',
                muted: '#94a3b8',
            },
            fontFamily: 'inter',
            borderRadius: 'sm',
            style: 'minimal',
        },
    },
    {
        id: 'coral-creative',
        name: 'Coral Creative',
        description: 'Divertido e acolhedor, para educação e comunidade',
        tags: ['education', 'community', 'fun'],
        designSystem: {
            palette: {
                primary: '#f472b6',
                secondary: '#fb7185',
                accent: '#38bdf8',
                background: '#fdf2f8',
                foreground: '#1e1b4b',
                muted: '#9ca3af',
            },
            fontFamily: 'poppins',
            borderRadius: 'full',
            style: 'playful',
        },
    },
    {
        id: 'midnight-pro',
        name: 'Midnight Pro',
        description: 'Dark mode premium, sofisticado para tech e devtools',
        tags: ['dark', 'tech', 'developer'],
        designSystem: {
            palette: {
                primary: '#3b82f6',
                secondary: '#60a5fa',
                accent: '#fbbf24',
                background: '#030712',
                foreground: '#f9fafb',
                muted: '#6b7280',
            },
            fontFamily: 'space-grotesk',
            borderRadius: 'md',
            style: 'modern',
        },
    },
    {
        id: 'forest-organic',
        name: 'Forest Organic',
        description: 'Terroso e autêntico, para alimentação e produtos naturais',
        tags: ['food', 'organic', 'natural'],
        designSystem: {
            palette: {
                primary: '#65a30d',
                secondary: '#84cc16',
                accent: '#d97706',
                background: '#fefce8',
                foreground: '#1a2e05',
                muted: '#78716c',
            },
            fontFamily: 'dm-sans',
            borderRadius: 'md',
            style: 'modern',
        },
    },
    {
        id: 'neural-dark',
        name: 'Neural Dark',
        description: 'Futurista e técnico, para produtos de IA, automação e machine learning — dark mode',
        tags: ['ai', 'automation', 'machine-learning', 'dark', 'tech', 'ia', 'neural'],
        designSystem: {
            palette: {
                primary: '#2E3A4F',
                secondary: '#3E4B62',
                accent: '#1DA1DB',
                background: '#101724',
                foreground: '#C4D0DE',
                muted: '#7E90A6',
            },
            fontFamily: 'space-grotesk',
            borderRadius: 'lg',
            style: 'modern',
        },
    },
    {
        id: 'neural-light',
        name: 'Neural Light',
        description: 'Limpo e inteligente, para produtos de IA, automação e machine learning — light mode',
        tags: ['ai', 'automation', 'machine-learning', 'light', 'tech', 'ia', 'neural'],
        designSystem: {
            palette: {
                primary: '#37455E',
                secondary: '#495A73',
                accent: '#1FA0D8',
                background: '#E6E6E6',
                foreground: '#0D1730',
                muted: '#8C9DB2',
            },
            fontFamily: 'space-grotesk',
            borderRadius: 'lg',
            style: 'modern',
        },
    },
]

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_DESIGN_SYSTEM: DesignSystem = DESIGN_PRESETS[0].designSystem

export function getPresetById(id: string): DesignPreset | undefined {
    return DESIGN_PRESETS.find(p => p.id === id)
}

function withPresetId(preset: DesignPreset): DesignSystem {
    return {
        ...preset.designSystem,
        presetId: preset.id,
    }
}

function normalizeText(input: string): string {
    return input
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
}

export function inferDesignSystemFromText(input: string): DesignSystem {
    const text = normalizeText(input)

    const keywordGroups: Array<{ keywords: string[]; presetId: string }> = [
        { keywords: ['imobiliaria', 'imovel', 'imoveis', 'apartamento', 'casa', 'condominio', 'bairro', 'corretor', 'alto padrao', 'lancamento'], presetId: 'urban-estate' },
        { keywords: ['clinica', 'saude', 'odontologica', 'odontologia', 'medico', 'estetica', 'psicologia', 'fisioterapia'], presetId: 'emerald-growth' },
        { keywords: ['advocacia', 'juridico', 'advogado', 'trabalhista', 'tributario', 'direito'], presetId: 'ocean-trust' },
        { keywords: ['consultoria', 'b2b', 'financeiro', 'financas', 'contabilidade', 'empresa'], presetId: 'ocean-trust' },
        { keywords: ['saas', 'software', 'startup', 'tecnologia', 'crm', 'automacao', 'plataforma'], presetId: 'indigo-tech' },
        { keywords: ['inteligencia artificial', 'ia', 'machine learning', 'llm', 'chatbot', 'neural', 'automacao ia', 'ai', 'gpt', 'modelos de linguagem', 'agente ia', 'agent ai'], presetId: 'neural-dark' },
        { keywords: ['curso', 'educacao', 'treinamento', 'certificacao', 'aulas'], presetId: 'coral-creative' },
        { keywords: ['restaurante', 'alimentacao', 'comida', 'delivery', 'gastronomia', 'organico'], presetId: 'forest-organic' },
        { keywords: ['beleza', 'moda', 'lifestyle', 'luxo', 'joias', 'premium'], presetId: 'rose-luxury' },
        { keywords: ['evento', 'marketing', 'criativo', 'agencia', 'publicidade'], presetId: 'sunset-energy' },
    ]

    for (const group of keywordGroups) {
        if (group.keywords.some(keyword => text.includes(keyword))) {
            const preset = getPresetById(group.presetId)
            if (preset) return withPresetId(preset)
        }
    }

    return withPresetId(DESIGN_PRESETS[0])
}

/**
 * Creates a DesignSystem from a legacy primaryColor-only config.
 * Derives secondary, accent, background, foreground, muted from the primary.
 */
export function designSystemFromPrimaryColor(primaryColor: string, theme: 'light' | 'dark'): DesignSystem {
    return {
        palette: {
            primary: primaryColor,
            secondary: adjustBrightness(primaryColor, 30),
            accent: rotateHue(primaryColor, 180),
            background: theme === 'dark' ? '#0f0f23' : '#fafbfc',
            foreground: theme === 'dark' ? '#f1f5f9' : '#0f172a',
            muted: theme === 'dark' ? '#64748b' : '#94a3b8',
        },
        fontFamily: 'inter',
        borderRadius: 'lg',
        style: 'modern',
    }
}

// ─── Dark / Light Snap ────────────────────────────────────────────────────────

/**
 * Swaps the background/foreground/muted of a palette to a dark or light mode
 * while preserving primary, secondary, and accent.
 */
export function snapPaletteToMode(palette: ColorPalette, mode: 'dark' | 'light'): ColorPalette {
    if (mode === 'dark') {
        return {
            ...palette,
            background: '#0f0f1a',
            foreground: '#f1f5f9',
            muted: '#64748b',
        }
    }
    return {
        ...palette,
        background: '#ffffff',
        foreground: '#0f172a',
        muted: '#94a3b8',
    }
}

/**
 * Returns 'dark' | 'light' | 'custom' based on the background luminance.
 */
export function detectPaletteMode(palette: ColorPalette): 'dark' | 'light' {
    const [, , l] = hexToHsl(palette.background)
    return l < 50 ? 'dark' : 'light'
}

// ─── Color Utilities ──────────────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const l = (max + min) / 2

    if (max === min) return [0, 0, l * 100]

    const d = max - min
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    let h = 0
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6

    return [h * 360, s * 100, l * 100]
}

function hslToHex(h: number, s: number, l: number): string {
    h = ((h % 360) + 360) % 360
    s = Math.max(0, Math.min(100, s)) / 100
    l = Math.max(0, Math.min(100, l)) / 100

    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => {
        const k = (n + h / 30) % 12
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
        return Math.round(255 * color).toString(16).padStart(2, '0')
    }
    return `#${f(0)}${f(8)}${f(4)}`
}

function adjustBrightness(hex: string, amount: number): string {
    const [h, s, l] = hexToHsl(hex)
    return hslToHex(h, s, Math.min(100, l + amount))
}

function rotateHue(hex: string, degrees: number): string {
    const [h, s, l] = hexToHsl(hex)
    return hslToHex(h + degrees, s, Math.min(85, Math.max(40, l)))
}

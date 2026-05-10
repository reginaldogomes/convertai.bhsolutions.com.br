import type { DesignSystem } from '@/domain/value-objects/design-system'

// ─── Nav ──────────────────────────────────────────────────────────────────────

export type SiteNavStyle = 'transparent' | 'frosted' | 'solid'

export interface SiteNavConfig {
    style: SiteNavStyle
    ctaText: string
    ctaUrl: string
    showCta: boolean
}

// ─── Footer ───────────────────────────────────────────────────────────────────

export type SiteFooterStyle = 'minimal' | 'columns' | 'centered'
export type SocialPlatform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok' | 'whatsapp'

export interface SocialLink {
    platform: SocialPlatform
    url: string
}

export interface FooterLinkGroup {
    title: string
    links: Array<{ label: string; url: string }>
}

export interface SiteFooterConfig {
    style: SiteFooterStyle
    tagline: string
    socialLinks: SocialLink[]
    linkGroups: FooterLinkGroup[]
    copyright: string
    showNewsletter: boolean
}

// ─── SEO ──────────────────────────────────────────────────────────────────────

export interface SiteSeoConfig {
    title: string
    description: string
    keywords: string[]
    ogImage: string | null
}

// ─── Modules ──────────────────────────────────────────────────────────────────

export interface SiteModulesConfig {
    chatbot: boolean
    analytics: boolean
    seo: boolean
    integrations: boolean
}

// ─── Pages ───────────────────────────────────────────────────────────────────

export interface SitePageMeta {
    id: string        // LP id
    navLabel: string  // label shown in nav (defaults to LP name)
    order: number     // position in nav
}

// ─── Root SiteConfig ──────────────────────────────────────────────────────────

export interface SiteConfig {
    theme: 'light' | 'dark'
    primaryColor: string
    logoUrl: string | null
    designSystem?: DesignSystem
    nav: SiteNavConfig
    footer: SiteFooterConfig
    seo: SiteSeoConfig
    modules: SiteModulesConfig
    /** Ordered page metadata — drives nav + ordering */
    pages: SitePageMeta[]
    /** Raw AI plan output, preserved for reference */
    plan?: Record<string, unknown>
}

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_SITE_NAV: SiteNavConfig = {
    style: 'frosted',
    ctaText: 'Falar conosco',
    ctaUrl: '#contato',
    showCta: true,
}

export const DEFAULT_SITE_FOOTER: SiteFooterConfig = {
    style: 'minimal',
    tagline: '',
    socialLinks: [],
    linkGroups: [],
    copyright: '',
    showNewsletter: false,
}

export const DEFAULT_SITE_SEO: SiteSeoConfig = {
    title: '',
    description: '',
    keywords: [],
    ogImage: null,
}

export const DEFAULT_SITE_MODULES: SiteModulesConfig = {
    chatbot: true,
    analytics: true,
    seo: false,
    integrations: false,
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
    theme: 'light',
    primaryColor: '#6366f1',
    logoUrl: null,
    nav: DEFAULT_SITE_NAV,
    footer: DEFAULT_SITE_FOOTER,
    seo: DEFAULT_SITE_SEO,
    modules: DEFAULT_SITE_MODULES,
    pages: [],
}

/** Merge a partial configJson from the DB with defaults, safely */
export function parseSiteConfig(raw: Record<string, unknown>): SiteConfig {
    return {
        theme: (raw.theme as SiteConfig['theme']) ?? DEFAULT_SITE_CONFIG.theme,
        primaryColor: (raw.primaryColor as string) ?? DEFAULT_SITE_CONFIG.primaryColor,
        logoUrl: (raw.logoUrl as string | null) ?? null,
        designSystem: raw.designSystem as DesignSystem | undefined,
        nav: { ...DEFAULT_SITE_NAV, ...(raw.nav as Partial<SiteNavConfig> ?? {}) },
        footer: { ...DEFAULT_SITE_FOOTER, ...(raw.footer as Partial<SiteFooterConfig> ?? {}) },
        seo: { ...DEFAULT_SITE_SEO, ...(raw.seo as Partial<SiteSeoConfig> ?? {}) },
        modules: { ...DEFAULT_SITE_MODULES, ...(raw.modules as Partial<SiteModulesConfig> ?? {}) },
        pages: (raw.pages as SitePageMeta[]) ?? [],
        plan: raw.plan as Record<string, unknown> | undefined,
    }
}

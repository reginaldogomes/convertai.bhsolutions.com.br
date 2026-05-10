'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { SectionRenderer } from '@/components/landing-sections'
import type { LandingPageSection } from '@/domain/entities'
import type { ColorPalette } from '@/domain/value-objects/design-system'
import { cn } from '@/lib/utils'
import { captureAttributionFromCurrentPage } from '@/lib/ads-attribution'
import { parseSiteConfig, type SiteConfig } from '@/types/site-config'
import { SiteHeader, SiteFooter, type SiteNavPage } from './site-shell'

const ChatWidget = dynamic(() => import('@/components/crm/ChatWidget').then(m => m.ChatWidget), {
    ssr: false,
})

// ─── CSS var helpers (full HSL pipeline) ─────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] | null {
    const m = hex.replace('#', '').match(/.{2}/g)
    if (!m || m.length < 3) return null
    const [r, g, b] = m.map(x => parseInt(x, 16) / 255)
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2
    if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        else if (max === g) h = ((b - r) / d + 2) / 6
        else h = ((r - g) / d + 4) / 6
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function buildPaletteCSSVars(palette: ColorPalette): React.CSSProperties {
    const vars: Record<string, string> = {}
    const keyMap: Record<string, string> = {
        primary: '--primary', secondary: '--secondary', accent: '--accent',
        background: '--background', foreground: '--foreground', muted: '--muted',
    }
    for (const [key, cssVar] of Object.entries(keyMap)) {
        const hex = palette[key as keyof ColorPalette]
        if (!hex) continue
        const hsl = hexToHsl(hex)
        if (hsl) vars[cssVar] = `${hsl[0]} ${hsl[1]}% ${hsl[2]}%`
        vars[`--color-${key}`] = hex
    }
    return vars as React.CSSProperties
}

function resolveFontFamily(font?: string): string {
    const map: Record<string, string> = {
        inter: '"Inter", sans-serif', roboto: '"Roboto", sans-serif',
        montserrat: '"Montserrat", sans-serif', poppins: '"Poppins", sans-serif',
        playfair: '"Playfair Display", serif',
    }
    return font ? (map[font] ?? 'inherit') : 'inherit'
}

function resolveBorderRadius(radius?: string): string {
    const map: Record<string, string> = { none: '0', sm: '0.25rem', md: '0.5rem', lg: '1rem', full: '9999px' }
    return radius ? (map[radius] ?? '0.5rem') : '0.5rem'
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface HomepageData {
    id: string
    name: string
    slug: string
    headline: string
    subheadline: string
    ctaText: string
    chatbotName: string
    chatbotWelcomeMessage: string
    sections: LandingPageSection[]
}

interface SiteViewProps {
    siteSlug: string
    siteName: string
    configJson: Record<string, unknown>
    homepage: HomepageData
    pages: SiteNavPage[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SiteView({ siteSlug, siteName, configJson, homepage, pages }: SiteViewProps) {
    const [shouldRenderChat, setShouldRenderChat] = useState(false)
    const config: SiteConfig = parseSiteConfig(configJson)

    const isDark = config.theme === 'dark'
    const primaryColor = config.primaryColor
    const designSystem = config.designSystem
    const hasSections = homepage.sections.length > 0

    const shellStyle: React.CSSProperties = {
        fontFamily: resolveFontFamily(designSystem?.fontFamily),
        '--radius': resolveBorderRadius(designSystem?.borderRadius),
        ...(designSystem?.palette ? buildPaletteCSSVars(designSystem.palette as ColorPalette) : {}),
    } as React.CSSProperties

    const navPages: SiteNavPage[] = pages.map(p => {
        const meta = config.pages.find(m => m.id === p.id)
        return { ...p, navLabel: meta?.navLabel ?? p.name, order: meta?.order ?? 0 }
    })

    useEffect(() => {
        const w = window as Window & {
            requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number
            cancelIdleCallback?: (id: number) => void
        }
        let tid: number | null = null
        let iid: number | null = null
        if (w.requestIdleCallback) iid = w.requestIdleCallback(() => setShouldRenderChat(true), { timeout: 2500 })
        else tid = window.setTimeout(() => setShouldRenderChat(true), 1200)
        return () => {
            if (tid) window.clearTimeout(tid)
            if (iid && w.cancelIdleCallback) w.cancelIdleCallback(iid)
        }
    }, [])

    useEffect(() => { captureAttributionFromCurrentPage() }, [homepage.id])

    return (
        <div className={cn('min-h-screen bg-background text-foreground', isDark && 'dark')} style={shellStyle}>
            <SiteHeader
                siteSlug={siteSlug}
                siteName={siteName}
                logoUrl={config.logoUrl}
                primaryColor={primaryColor}
                navConfig={config.nav}
                pages={navPages}
                currentSlug={undefined}
            />

            <main className={cn(config.nav.style === 'transparent' && hasSections && '-mt-16')}>
                {hasSections ? (
                    <SectionRenderer
                        sections={homepage.sections}
                        primaryColor={primaryColor}
                        palette={designSystem?.palette as ColorPalette | undefined}
                        isDark={isDark}
                        landingPageId={homepage.id}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 pt-16">
                        <h1 className="text-4xl font-black tracking-tight text-foreground mb-4">
                            {homepage.headline || siteName}
                        </h1>
                        {homepage.subheadline && (
                            <p className="text-lg text-muted-foreground max-w-xl">{homepage.subheadline}</p>
                        )}
                    </div>
                )}
            </main>

            <SiteFooter
                siteSlug={siteSlug}
                siteName={siteName}
                primaryColor={primaryColor}
                footerConfig={config.footer}
                pages={navPages}
            />

            {shouldRenderChat && homepage.chatbotName && (
                <ChatWidget
                    landingPageId={homepage.id}
                    chatbotName={homepage.chatbotName}
                    welcomeMessage={homepage.chatbotWelcomeMessage}
                    primaryColor={primaryColor}
                />
            )}
        </div>
    )
}

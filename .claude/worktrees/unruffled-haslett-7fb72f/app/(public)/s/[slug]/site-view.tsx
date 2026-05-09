'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { SectionRenderer } from '@/components/landing-sections'
import type { LandingPageSection } from '@/domain/entities'
import type { ColorPalette, DesignSystem } from '@/domain/value-objects/design-system'
import { Container } from '@/components/ui/container'
import { cn, getContrastTextColor } from '@/lib/utils'
import { captureAttributionFromCurrentPage } from '@/lib/ads-attribution'

const ChatWidget = dynamic(() => import('@/components/crm/ChatWidget').then(m => m.ChatWidget), {
    ssr: false,
})

interface SiteNavPage {
    id: string
    name: string
    slug: string
    isHomepage: boolean
}

interface SiteConfig {
    theme: 'light' | 'dark'
    primaryColor: string
    designSystem?: DesignSystem
    logoUrl: string | null
    seo?: { title?: string; description?: string }
}

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
    siteConfig: SiteConfig
    homepage: HomepageData
    pages: SiteNavPage[]
}

function getVisitorId(): string {
    let id = localStorage.getItem('ag_visitor_id')
    if (!id) {
        id = crypto.randomUUID()
        localStorage.setItem('ag_visitor_id', id)
    }
    return id
}

function resolveFontFamily(font?: string): string {
    if (!font) return 'inherit'
    const map: Record<string, string> = {
        inter: '"Inter", sans-serif',
        roboto: '"Roboto", sans-serif',
        montserrat: '"Montserrat", sans-serif',
        poppins: '"Poppins", sans-serif',
        playfair: '"Playfair Display", serif',
    }
    return map[font] ?? 'inherit'
}

function resolveBorderRadius(radius?: string): string {
    if (!radius) return '0.5rem'
    const map: Record<string, string> = { none: '0', sm: '0.25rem', md: '0.5rem', lg: '1rem', full: '9999px' }
    return map[radius] ?? '0.5rem'
}

function buildPaletteCSSVars(palette: ColorPalette): React.CSSProperties {
    if (!palette) return {}
    const vars: Record<string, string> = {}
    Object.entries(palette).forEach(([key, value]) => {
        if (typeof value === 'string') vars[`--color-${key}`] = value
    })
    return vars as React.CSSProperties
}

export function SiteView({ siteSlug, siteName, siteConfig, homepage, pages }: SiteViewProps) {
    const [shouldRenderChat, setShouldRenderChat] = useState(false)
    const isDark = siteConfig.theme === 'dark'
    const primaryColor = siteConfig.primaryColor
    const designSystem = siteConfig.designSystem
    const hasSections = homepage.sections.length > 0

    const shellStyle: React.CSSProperties = {
        fontFamily: resolveFontFamily(designSystem?.fontFamily),
        borderRadius: resolveBorderRadius(designSystem?.borderRadius),
        ...(designSystem?.palette ? buildPaletteCSSVars(designSystem.palette as ColorPalette) : {}),
    }

    useEffect(() => {
        const idleWindow = window as Window & {
            requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
            cancelIdleCallback?: (id: number) => void
        }
        let tid: number | null = null
        let iid: number | null = null
        if (idleWindow.requestIdleCallback) {
            iid = idleWindow.requestIdleCallback(() => setShouldRenderChat(true), { timeout: 2500 })
        } else {
            tid = window.setTimeout(() => setShouldRenderChat(true), 1200)
        }
        return () => {
            if (tid !== null) window.clearTimeout(tid)
            if (iid !== null && idleWindow.cancelIdleCallback) idleWindow.cancelIdleCallback(iid)
        }
    }, [])

    useEffect(() => {
        captureAttributionFromCurrentPage()
    }, [homepage.id])

    const navPages = pages.filter(p => !p.isHomepage)

    return (
        <div className={cn('min-h-screen bg-background text-foreground', isDark && 'dark')} style={shellStyle}>
            {/* Site navigation header */}
            <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
                <Container className="flex h-14 items-center justify-between gap-6">
                    {/* Brand */}
                    <Link href={`/s/${siteSlug}`} className="flex items-center gap-2 min-w-0 shrink-0">
                        {siteConfig.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={siteConfig.logoUrl} alt={siteName} className="h-7 object-contain" />
                        ) : (
                            <span className="font-bold text-sm text-foreground truncate">{siteName}</span>
                        )}
                    </Link>

                    {/* Page links */}
                    {navPages.length > 0 && (
                        <nav className="hidden md:flex items-center gap-5">
                            {navPages.map(page => (
                                <Link
                                    key={page.id}
                                    href={`/s/${siteSlug}/${page.slug}`}
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {page.name}
                                </Link>
                            ))}
                        </nav>
                    )}

                    {/* CTA */}
                    <a
                        href="#contato"
                        className="inline-flex shrink-0 items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
                        style={{ backgroundColor: primaryColor, color: getContrastTextColor(primaryColor) }}
                    >
                        {homepage.ctaText || 'Falar conosco'}
                    </a>
                </Container>
            </header>

            {/* Main content */}
            {hasSections ? (
                <SectionRenderer
                    sections={homepage.sections}
                    primaryColor={primaryColor}
                    palette={designSystem?.palette as ColorPalette | undefined}
                    isDark={isDark}
                    landingPageId={homepage.id}
                />
            ) : (
                <main className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <h1 className="text-4xl font-black tracking-tight text-foreground mb-4">{homepage.headline || siteName}</h1>
                    {homepage.subheadline && (
                        <p className="text-lg text-muted-foreground max-w-xl">{homepage.subheadline}</p>
                    )}
                </main>
            )}

            {/* Site footer */}
            <footer className="border-t border-border/60 bg-background py-8 mt-12">
                <Container className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <span>{siteName}</span>
                    {navPages.length > 0 && (
                        <div className="flex items-center gap-4">
                            {navPages.map(page => (
                                <Link key={page.id} href={`/s/${siteSlug}/${page.slug}`} className="hover:text-foreground transition-colors">
                                    {page.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </Container>
            </footer>

            {/* Chat widget */}
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

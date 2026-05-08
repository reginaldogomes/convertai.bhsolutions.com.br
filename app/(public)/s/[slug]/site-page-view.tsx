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

interface SitePageConfig {
    theme: 'light' | 'dark'
    primaryColor: string
    designSystem?: DesignSystem
    logoUrl: string | null
}

interface PageData {
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

interface SitePageViewProps {
    siteSlug: string
    siteName: string
    siteConfig: SitePageConfig
    page: PageData
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

export function SitePageView({ siteSlug, siteName, siteConfig, page, pages }: SitePageViewProps) {
    const [shouldRenderChat, setShouldRenderChat] = useState(false)
    const isDark = siteConfig.theme === 'dark'
    const primaryColor = siteConfig.primaryColor
    const designSystem = siteConfig.designSystem
    const hasSections = page.sections.length > 0

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
    }, [page.id])

    const navPages = pages.filter(p => !p.isHomepage)

    return (
        <div className={cn('min-h-screen bg-background text-foreground', isDark && 'dark')} style={shellStyle}>
            {/* Site navigation header */}
            <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
                <Container className="flex h-14 items-center justify-between gap-6">
                    <Link href={`/s/${siteSlug}`} className="flex items-center gap-2 min-w-0 shrink-0">
                        {siteConfig.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={siteConfig.logoUrl} alt={siteName} className="h-7 object-contain" />
                        ) : (
                            <span className="font-bold text-sm text-foreground truncate">{siteName}</span>
                        )}
                    </Link>

                    {navPages.length > 0 && (
                        <nav className="hidden md:flex items-center gap-5">
                            {navPages.map(p => (
                                <Link
                                    key={p.id}
                                    href={`/s/${siteSlug}/${p.slug}`}
                                    className={cn(
                                        'text-sm transition-colors',
                                        p.slug === page.slug
                                            ? 'font-semibold text-foreground'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    {p.name}
                                </Link>
                            ))}
                        </nav>
                    )}

                    <a
                        href="#contato"
                        className="inline-flex shrink-0 items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
                        style={{ backgroundColor: primaryColor, color: getContrastTextColor(primaryColor) }}
                    >
                        {page.ctaText || 'Falar conosco'}
                    </a>
                </Container>
            </header>

            {/* Page content */}
            {hasSections ? (
                <SectionRenderer
                    sections={page.sections}
                    primaryColor={primaryColor}
                    palette={designSystem?.palette as ColorPalette | undefined}
                    isDark={isDark}
                    landingPageId={page.id}
                />
            ) : (
                <main className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <h1 className="text-4xl font-black tracking-tight text-foreground mb-4">{page.headline || page.name}</h1>
                    {page.subheadline && (
                        <p className="text-lg text-muted-foreground max-w-xl">{page.subheadline}</p>
                    )}
                </main>
            )}

            {/* Footer */}
            <footer className="border-t border-border/60 bg-background py-8 mt-12">
                <Container className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <Link href={`/s/${siteSlug}`} className="hover:text-foreground transition-colors">{siteName}</Link>
                    {navPages.length > 0 && (
                        <div className="flex items-center gap-4">
                            {navPages.map(p => (
                                <Link key={p.id} href={`/s/${siteSlug}/${p.slug}`} className="hover:text-foreground transition-colors">
                                    {p.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </Container>
            </footer>

            {/* Chat widget */}
            {shouldRenderChat && page.chatbotName && (
                <ChatWidget
                    landingPageId={page.id}
                    chatbotName={page.chatbotName}
                    welcomeMessage={page.chatbotWelcomeMessage}
                    primaryColor={primaryColor}
                />
            )}
        </div>
    )
}

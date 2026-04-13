'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { SectionRenderer } from '@/components/landing-sections'
import type { LandingPageSection } from '@/domain/entities'
import type { ColorPalette, DesignSystem } from '@/domain/value-objects/design-system'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BRAND } from '@/lib/brand'
import { cn, getContrastTextColor } from '@/lib/utils'
import { buildAdsMetadata, captureAttributionFromCurrentPage } from '@/lib/ads-attribution'
import { ConsentBanner } from './consent-banner'

const ChatWidget = dynamic(() => import('@/components/crm/ChatWidget').then(m => m.ChatWidget), {
    ssr: false,
})

interface LandingPageConfig {
    theme: 'light' | 'dark'
    primaryColor: string
    designSystem?: DesignSystem
    logoUrl: string | null
    sections: LandingPageSection[]
}

interface LandingPageViewProps {
    page: {
        id: string
        name: string
        slug: string
        headline: string
        subheadline: string
        ctaText: string
        chatbotName: string
        chatbotWelcomeMessage: string
        config: LandingPageConfig
    }
}

function getVisitorId(): string {
    let id = localStorage.getItem('ag_visitor_id')
    if (!id) {
        id = crypto.randomUUID()
        localStorage.setItem('ag_visitor_id', id)
    }
    return id
}

export function LandingPageView({ page }: LandingPageViewProps) {
    const [shouldRenderChat, setShouldRenderChat] = useState(false)
    const { config } = page
    const isDark = config.theme === 'dark'
    const hasSections = config.sections && config.sections.length > 0
    const designSystem = config.designSystem
    const shellStyle = {
        fontFamily: resolveFontFamily(designSystem?.fontFamily),
        borderRadius: resolveBorderRadius(designSystem?.borderRadius),
        backgroundImage: resolveStyleBackground(designSystem?.style, config.designSystem?.palette as ColorPalette | undefined),
        ...(designSystem?.palette ? buildPaletteCSSVars(designSystem.palette) : {}),
    }

    useEffect(() => {
        const idleWindow = window as Window & {
            requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
            cancelIdleCallback?: (id: number) => void
        }

        let timeoutId: number | null = null
        let idleId: number | null = null

        if (idleWindow.requestIdleCallback) {
            idleId = idleWindow.requestIdleCallback(() => setShouldRenderChat(true), { timeout: 2500 })
        } else {
            timeoutId = window.setTimeout(() => setShouldRenderChat(true), 1200)
        }

        return () => {
            if (timeoutId !== null) window.clearTimeout(timeoutId)
            if (idleId !== null && idleWindow.cancelIdleCallback) idleWindow.cancelIdleCallback(idleId)
        }
    }, [])

    useEffect(() => {
        captureAttributionFromCurrentPage()

        trackAnalyticsEvent({
            landingPageId: page.id,
            eventType: 'view',
            visitorId: getVisitorId(),
            metadata: buildAdsMetadata('view'),
        })
    }, [page.id])

    const handleCtaClick = (targetUrl?: string) => {
        const normalizedTarget = targetUrl?.toLowerCase() ?? ''
        const ctaAction = normalizedTarget.includes('wa.me') || normalizedTarget.includes('whatsapp')
            ? 'click_whatsapp'
            : 'cta_click'

        trackAnalyticsEvent({
            landingPageId: page.id,
            eventType: 'cta_click',
            visitorId: getVisitorId(),
            metadata: {
                ...buildAdsMetadata('cta_click'),
                ctaAction,
                ctaTarget: targetUrl ?? '#contato',
            },
        })
    }

    return (
        <div className={cn('min-h-screen bg-background text-foreground', isDark && 'dark')} style={shellStyle}>
            <div className={cn('min-h-screen bg-background text-foreground', hasSections && 'pb-20 md:pb-0')}>
                {hasSections ? (
                    <>
                        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/75">
                            <Container className="flex h-14 items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-foreground">{page.name}</p>
                                </div>
                                <a
                                    href="#contato"
                                    onClick={() => handleCtaClick('#contato')}
                                    className="inline-flex shrink-0 items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
                                    style={{ backgroundColor: config.primaryColor, color: getContrastTextColor(config.primaryColor) }}
                                >
                                    {page.ctaText || 'Falar com especialista'}
                                </a>
                            </Container>
                        </header>

                        <SectionRenderer
                            sections={config.sections}
                            primaryColor={config.primaryColor}
                            palette={config.designSystem?.palette}
                            isDark={isDark}
                            landingPageId={page.id}
                            onCtaClick={handleCtaClick}
                        />
                    </>
                ) : (
                    <>
                        <header className="gradient-mesh relative overflow-hidden border-b border-border/60 bg-background">
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: `radial-gradient(ellipse 90% 60% at 50% -5%, ${config.primaryColor}18 0%, transparent 65%)`,
                                }}
                            />
                            <div className="bg-dot-grid absolute inset-0 opacity-[0.03]" />
                            <Container className="relative py-24 text-center md:py-32">
                                {config.logoUrl && (
                                    <Image
                                        src={config.logoUrl}
                                        alt={page.name}
                                        width={160}
                                        height={48}
                                        priority
                                        className="mx-auto mb-10 h-12 object-contain"
                                    />
                                )}
                                <h1 className="text-balance mb-6 text-4xl font-black leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl">
                                    {page.headline}
                                </h1>
                                {page.subheadline && (
                                    <p className="text-pretty mx-auto mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-xl">
                                        {page.subheadline}
                                    </p>
                                )}
                                <Button
                                    onClick={handleCtaClick}
                                    size="lg"
                                    className="rounded-xl px-7"
                                    style={{ backgroundColor: config.primaryColor, borderColor: config.primaryColor, color: getContrastTextColor(config.primaryColor) }}
                                >
                                    {page.ctaText}
                                </Button>
                            </Container>
                        </header>

                        <section className="bg-background-secondary py-20">
                            <Container>
                                <h2 className="mb-3 text-center text-2xl font-black tracking-tight text-foreground md:text-3xl">
                                    Como podemos ajudar?
                                </h2>
                                <p className="mx-auto mb-12 max-w-lg text-center text-base text-muted-foreground">
                                    Converse com nosso assistente para saber mais sobre nossos produtos e servicos.
                                </p>
                                <div className="grid gap-5 md:grid-cols-3">
                                    {[
                                        { title: 'Atendimento Instantaneo', desc: 'Respostas imediatas 24/7 pelo chat' },
                                        { title: 'Informacoes Precisas', desc: 'Base de conhecimento completa sobre nossos servicos' },
                                        { title: 'Contato Direto', desc: 'Fale conosco e receba uma proposta personalizada' },
                                    ].map((item) => (
                                        <Card key={item.title} className="rounded-2xl border-border/70 py-0 transition-all duration-200 hover:-translate-y-1">
                                            <CardContent className="p-6">
                                                <h3 className="mb-2 text-base font-semibold text-foreground">{item.title}</h3>
                                                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </Container>
                        </section>
                    </>
                )}

                <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
                    <p>Powered by <span className="font-semibold text-foreground">{BRAND.poweredBy}</span></p>
                </footer>
            </div>

            {hasSections && (
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 p-3 backdrop-blur md:hidden">
                    <a
                        href="#contato"
                        onClick={() => handleCtaClick('#contato')}
                        className="inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-bold transition-opacity hover:opacity-90"
                        style={{ backgroundColor: config.primaryColor, color: getContrastTextColor(config.primaryColor) }}
                    >
                        {page.ctaText || 'Falar com especialista'}
                    </a>
                </div>
            )}

            {/* Chat Widget */}
            {shouldRenderChat && (
                <ChatWidget
                    pageId={page.id}
                    chatbotName={page.chatbotName}
                    welcomeMessage={page.chatbotWelcomeMessage}
                    primaryColor={config.primaryColor}
                />
            )}

            <ConsentBanner />
        </div>
    )
}

function trackAnalyticsEvent(payload: {
    landingPageId: string
    eventType: 'view' | 'cta_click'
    visitorId: string
    metadata: Record<string, unknown>
}) {
    const body = JSON.stringify(payload)

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([body], { type: 'application/json' })
        navigator.sendBeacon('/api/analytics/track', blob)
        return
    }

    fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
    }).catch(() => {})
}

function resolveFontFamily(fontFamily: DesignSystem['fontFamily'] | undefined): string | undefined {
    switch (fontFamily) {
        case 'poppins':
            return 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif'
        case 'dm-sans':
            return 'DM Sans, Inter, ui-sans-serif, system-ui, sans-serif'
        case 'space-grotesk':
            return 'Space Grotesk, Inter, ui-sans-serif, system-ui, sans-serif'
        case 'playfair':
            return 'Playfair Display, Georgia, Times New Roman, serif'
        default:
            return 'Inter, ui-sans-serif, system-ui, sans-serif'
    }
}

function resolveBorderRadius(borderRadius: DesignSystem['borderRadius'] | undefined): string | undefined {
    switch (borderRadius) {
        case 'none':
            return '0px'
        case 'sm':
            return '10px'
        case 'md':
            return '16px'
        case 'full':
            return '999px'
        default:
            return '24px'
    }
}

function resolveStyleBackground(style: DesignSystem['style'] | undefined, palette?: ColorPalette): string | undefined {
    if (!palette) return undefined

    switch (style) {
        case 'elegant':
            return `radial-gradient(circle at top right, ${palette.accent}30 0%, transparent 36%), radial-gradient(circle at bottom left, ${palette.primary}1a 0%, transparent 30%), linear-gradient(135deg, ${palette.background}, ${palette.background})`
        case 'corporate':
            return `linear-gradient(180deg, ${palette.background}, ${palette.background}), linear-gradient(90deg, ${palette.primary}12 1px, transparent 1px), linear-gradient(${palette.primary}12 1px, transparent 1px)`
        case 'bold':
            return `radial-gradient(circle at 20% 10%, ${palette.primary}28 0%, transparent 36%), radial-gradient(circle at 80% 0%, ${palette.accent}28 0%, transparent 32%), linear-gradient(135deg, ${palette.background}, ${palette.background})`
        case 'minimal':
            return `linear-gradient(180deg, ${palette.background}, ${palette.background})`
        case 'playful':
            return `radial-gradient(circle at 10% 20%, ${palette.primary}26 0%, transparent 30%), radial-gradient(circle at 90% 10%, ${palette.secondary}22 0%, transparent 28%), linear-gradient(135deg, ${palette.background}, ${palette.background})`
        default:
            return `radial-gradient(circle at top left, ${palette.primary}22 0%, transparent 32%), radial-gradient(circle at bottom right, ${palette.accent}18 0%, transparent 28%), linear-gradient(135deg, ${palette.background}, ${palette.background})`
    }
}

// ─── Palette → CSS Custom Properties ─────────────────────────────────────────
// Converts palette hex colors to HSL CSS variable format ("H S% L%") so that
// all Tailwind utility classes (bg-background, text-foreground, surface-glass,
// etc.) automatically reflect the user's chosen palette on public landing pages.

function hexToHslVar(hex: string): string {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return '0 0% 50%'
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    const l = (max + min) / 2
    if (max === min) return `0 0% ${Math.round(l * 100)}%`
    const d = max - min
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    let h = 0
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

function shiftL(hslVar: string, delta: number): string {
    const parts = hslVar.split(' ')
    const lNum = parseFloat(parts[2])
    return `${parts[0]} ${parts[1]} ${Math.round(Math.min(100, Math.max(0, lNum + delta)))}%`
}

function buildPaletteCSSVars(palette: ColorPalette): React.CSSProperties {
    const bg        = hexToHslVar(palette.background)
    const fg        = hexToHslVar(palette.foreground)
    const muted     = hexToHslVar(palette.muted)
    const primary   = hexToHslVar(palette.primary)
    const secondary = hexToHslVar(palette.secondary)
    const accent    = hexToHslVar(palette.accent)

    const bgL      = parseFloat(bg.split(' ')[2])
    const isDark   = bgL < 50
    const primaryL = parseFloat(primary.split(' ')[2])

    // Layered surface colors — increasing lightness deltas for clear visual separation
    const bgSec     = shiftL(bg, isDark ? 7  : -5)   // section alternation
    const card      = shiftL(bg, isDark ? 15 : -9)   // card fill — clearly distinct
    const border    = shiftL(bg, isDark ? 26 : -18)  // border lines — visible grid
    const borderSub = shiftL(bg, isDark ? 18 : -12)  // subtle borders

    // Muted-foreground clamped for legibility: ≥50% L on dark, ≤50% L on light
    const [mH, mS, mLRaw] = muted.split(' ')
    const mutedL     = parseFloat(mLRaw)
    const safeMutedL = isDark ? Math.max(mutedL, 50) : Math.min(mutedL, 50)
    const safeMuted  = `${mH} ${mS} ${Math.round(safeMutedL)}%`

    // Muted bg surface (used by <section class="bg-muted">)
    const mutedBg = shiftL(bg, isDark ? 10 : -7)

    // Primary foreground: white for dark/saturated primaries, dark for light/pastel ones
    const primaryFg = primaryL < 62 ? '0 0% 100%' : '220 15% 10%'

    // Primary-subtle: used for glow halos, badge bgs — slightly desaturated + lightness-shifted
    const [pH, pSRaw] = primary.split(' ')
    const pS = parseFloat(pSRaw)
    const primarySubtle = `${pH} ${Math.round(pS * 0.55)}% ${isDark ? Math.min(bgL + 10, 22) : Math.max(bgL - 8, 85)}%`
    const primarySoft   = `${pH} ${Math.round(pS * 0.45)}% ${isDark ? Math.min(bgL + 18, 30) : Math.max(bgL - 14, 80)}%`

    // Accent foreground
    const accentL = parseFloat(accent.split(' ')[2])
    const accentFg = accentL < 62 ? '0 0% 100%' : '220 15% 10%'

    return {
        '--background':           bg,
        '--background-secondary': bgSec,
        '--background-tertiary':  shiftL(bg, isDark ? -3 : 4),
        '--foreground':           fg,
        '--foreground-secondary': shiftL(fg, isDark ? -20 : 20),
        '--foreground-muted':     safeMuted,
        '--muted':                mutedBg,
        '--muted-foreground':     safeMuted,
        '--card':                 card,
        '--card-foreground':      fg,
        '--popover':              card,
        '--popover-foreground':   fg,
        '--border':               border,
        '--border-subtle':        borderSub,
        '--input':                border,
        '--primary':              primary,
        '--primary-foreground':   primaryFg,
        '--primary-hover':        primaryL < 80 ? shiftL(primary, isDark ? 8 : -8) : shiftL(primary, -8),
        '--primary-subtle':       primarySubtle,
        '--primary-soft':         primarySoft,
        '--secondary':            secondary,
        '--secondary-foreground': fg,
        '--accent':               accent,
        '--accent-foreground':    accentFg,
        '--ring':                 primary,
    } as React.CSSProperties
}

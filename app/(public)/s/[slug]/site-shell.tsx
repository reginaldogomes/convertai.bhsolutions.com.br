'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Instagram, Facebook, Linkedin, Youtube, Twitter, MessageCircle } from 'lucide-react'
import { cn, getContrastTextColor } from '@/lib/utils'
import { Container } from '@/components/ui/container'
import type { SiteConfig, SocialLink, FooterLinkGroup } from '@/types/site-config'

// ─── Shared nav page type ────────────────────────────────────────────────────

export interface SiteNavPage {
    id: string
    name: string
    slug: string
    navLabel?: string
    isHomepage: boolean
    order?: number
}

// ─── Header ───────────────────────────────────────────────────────────────────

interface SiteHeaderProps {
    siteSlug: string
    siteName: string
    logoUrl: string | null
    primaryColor: string
    navConfig: SiteConfig['nav']
    pages: SiteNavPage[]
    currentSlug?: string
}

function NavStyle({ style }: { style: SiteConfig['nav']['style'] }) {
    if (style === 'transparent') return 'absolute top-0 left-0 right-0 z-40 bg-transparent border-transparent'
    if (style === 'frosted')
        return 'sticky top-0 z-40 border-b border-white/10 bg-white/80 dark:bg-black/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70'
    // solid
    return 'sticky top-0 z-40 border-b border-border bg-background shadow-sm'
}

function NavTextColor({ style }: { style: SiteConfig['nav']['style'] }) {
    if (style === 'transparent') return { link: 'text-white/80 hover:text-white', brand: 'text-white' }
    return { link: 'text-muted-foreground hover:text-foreground', brand: 'text-foreground' }
}

export function SiteHeader({ siteSlug, siteName, logoUrl, primaryColor, navConfig, pages, currentSlug }: SiteHeaderProps) {
    const [open, setOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    const navPages = [...pages]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    const isTransparent = navConfig.style === 'transparent'
    const colors = NavTextColor({ style: navConfig.style })

    useEffect(() => {
        if (!isTransparent) return
        const handler = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', handler, { passive: true })
        return () => window.removeEventListener('scroll', handler)
    }, [isTransparent])

    const headerClass = isTransparent
        ? cn(
            'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
            scrolled
                ? 'border-b border-border/60 bg-background/90 backdrop-blur-xl'
                : 'bg-transparent border-transparent'
        )
        : NavStyle({ style: navConfig.style })

    const textColor = isTransparent && !scrolled ? colors : NavTextColor({ style: 'solid' })

    return (
        <header className={headerClass}>
            <Container className="flex h-16 items-center justify-between gap-4">
                {/* Brand */}
                <Link
                    href={`/s/${siteSlug}`}
                    className={cn('flex items-center gap-2.5 min-w-0 shrink-0', isTransparent && !scrolled ? 'text-white' : 'text-foreground')}
                >
                    {logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
                    ) : (
                        <span className="font-extrabold text-base tracking-tight truncate">
                            {siteName}
                        </span>
                    )}
                </Link>

                {/* Desktop nav */}
                {navPages.length > 1 && (
                    <nav className="hidden md:flex items-center gap-1">
                        {navPages.map(page => {
                            const isActive = page.isHomepage
                                ? currentSlug === undefined
                                : page.slug === currentSlug
                            return (
                                <Link
                                    key={page.id}
                                    href={page.isHomepage ? `/s/${siteSlug}` : `/s/${siteSlug}/${page.slug}`}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                                        isActive
                                            ? 'text-foreground bg-foreground/8'
                                            : isTransparent && !scrolled
                                                ? 'text-white/80 hover:text-white hover:bg-white/10'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                                    )}
                                >
                                    {page.navLabel ?? page.name}
                                </Link>
                            )
                        })}
                    </nav>
                )}

                {/* CTA + hamburger */}
                <div className="flex items-center gap-2 shrink-0">
                    {navConfig.showCta && (
                        <a
                            href={navConfig.ctaUrl}
                            className="hidden sm:inline-flex items-center justify-center rounded-lg px-4 py-1.5 text-xs font-bold tracking-wide transition-opacity hover:opacity-90 active:scale-95"
                            style={{
                                backgroundColor: primaryColor,
                                color: getContrastTextColor(primaryColor),
                            }}
                        >
                            {navConfig.ctaText}
                        </a>
                    )}

                    {/* Mobile hamburger */}
                    <button
                        type="button"
                        onClick={() => setOpen(v => !v)}
                        aria-label="Menu"
                        className={cn(
                            'md:hidden flex items-center justify-center size-9 rounded-lg transition-colors',
                            isTransparent && !scrolled
                                ? 'text-white hover:bg-white/10'
                                : 'text-foreground hover:bg-muted/70'
                        )}
                    >
                        {open ? <X className="size-5" /> : <Menu className="size-5" />}
                    </button>
                </div>
            </Container>

            {/* Mobile menu drawer */}
            {open && (
                <div className="md:hidden border-t border-border/60 bg-background/98 backdrop-blur-xl">
                    <div className="px-4 py-4 space-y-1">
                        {navPages.map(page => (
                            <Link
                                key={page.id}
                                href={page.isHomepage ? `/s/${siteSlug}` : `/s/${siteSlug}/${page.slug}`}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                    (page.isHomepage ? currentSlug === undefined : page.slug === currentSlug)
                                        ? 'text-foreground bg-muted'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                                )}
                            >
                                {page.navLabel ?? page.name}
                            </Link>
                        ))}
                        {navConfig.showCta && (
                            <a
                                href={navConfig.ctaUrl}
                                onClick={() => setOpen(false)}
                                className="flex w-full items-center justify-center rounded-lg px-4 py-2.5 mt-2 text-sm font-bold transition-opacity hover:opacity-90"
                                style={{ backgroundColor: primaryColor, color: getContrastTextColor(primaryColor) }}
                            >
                                {navConfig.ctaText}
                            </a>
                        )}
                    </div>
                </div>
            )}
        </header>
    )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    instagram: Instagram,
    facebook: Facebook,
    linkedin: Linkedin,
    youtube: Youtube,
    twitter: Twitter,
    tiktok: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.93a8.16 8.16 0 0 0 4.77 1.52V7.01a4.85 4.85 0 0 1-1-.32Z" />
        </svg>
    ),
    whatsapp: MessageCircle,
}

function SocialIconLink({ link }: { link: SocialLink }) {
    const Icon = SOCIAL_ICONS[link.platform]
    if (!Icon) return null
    return (
        <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.platform}
            className="flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
        >
            <Icon className="size-4" />
        </a>
    )
}

interface SiteFooterProps {
    siteSlug: string
    siteName: string
    primaryColor: string
    footerConfig: SiteConfig['footer']
    pages: SiteNavPage[]
}

export function SiteFooter({ siteSlug, siteName, primaryColor, footerConfig, pages }: SiteFooterProps) {
    const year = new Date().getFullYear()
    const copyright = footerConfig.copyright || `© ${year} ${siteName}. Todos os direitos reservados.`
    const navPages = [...pages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    // ── Minimal ──────────────────────────────────────────────────────────────
    if (footerConfig.style === 'minimal') {
        return (
            <footer className="border-t border-border/60 bg-background mt-16">
                <Container className="py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <Link href={`/s/${siteSlug}`} className="font-semibold text-foreground hover:text-foreground/80 transition-colors">
                        {siteName}
                    </Link>
                    <div className="flex items-center flex-wrap justify-center gap-x-4 gap-y-1">
                        {navPages.map(p => (
                            <Link
                                key={p.id}
                                href={p.isHomepage ? `/s/${siteSlug}` : `/s/${siteSlug}/${p.slug}`}
                                className="hover:text-foreground transition-colors"
                            >
                                {p.navLabel ?? p.name}
                            </Link>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        {footerConfig.socialLinks.map(link => (
                            <SocialIconLink key={link.platform} link={link} />
                        ))}
                    </div>
                </Container>
                <div className="border-t border-border/40">
                    <Container className="py-3 text-[11px] text-muted-foreground/60 text-center">
                        {copyright}
                    </Container>
                </div>
            </footer>
        )
    }

    // ── Centered ──────────────────────────────────────────────────────────────
    if (footerConfig.style === 'centered') {
        return (
            <footer className="border-t border-border/60 bg-background mt-16">
                <Container className="py-14 flex flex-col items-center gap-6 text-center">
                    <Link href={`/s/${siteSlug}`} className="font-extrabold text-lg tracking-tight text-foreground">
                        {siteName}
                    </Link>
                    {footerConfig.tagline && (
                        <p className="text-sm text-muted-foreground max-w-xs">{footerConfig.tagline}</p>
                    )}
                    {navPages.length > 0 && (
                        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                            {navPages.map(p => (
                                <Link
                                    key={p.id}
                                    href={p.isHomepage ? `/s/${siteSlug}` : `/s/${siteSlug}/${p.slug}`}
                                    className="hover:text-foreground transition-colors"
                                >
                                    {p.navLabel ?? p.name}
                                </Link>
                            ))}
                        </nav>
                    )}
                    {footerConfig.socialLinks.length > 0 && (
                        <div className="flex items-center gap-2">
                            {footerConfig.socialLinks.map(link => (
                                <SocialIconLink key={link.platform} link={link} />
                            ))}
                        </div>
                    )}
                    <p className="text-[11px] text-muted-foreground/60">{copyright}</p>
                </Container>
            </footer>
        )
    }

    // ── Columns (default / premium) ───────────────────────────────────────────
    const hasLinkGroups = footerConfig.linkGroups && footerConfig.linkGroups.length > 0

    return (
        <footer className="border-t border-border/60 bg-background mt-16">
            <Container className="py-14">
                <div className={cn(
                    'grid gap-10',
                    hasLinkGroups
                        ? 'grid-cols-1 md:grid-cols-[1fr_auto] lg:grid-cols-[280px_1fr]'
                        : 'grid-cols-1'
                )}>
                    {/* Brand column */}
                    <div className="space-y-4">
                        <Link href={`/s/${siteSlug}`} className="inline-block font-extrabold text-lg tracking-tight text-foreground">
                            {siteName}
                        </Link>
                        {footerConfig.tagline && (
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                                {footerConfig.tagline}
                            </p>
                        )}
                        {footerConfig.socialLinks.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-1">
                                {footerConfig.socialLinks.map(link => (
                                    <SocialIconLink key={link.platform} link={link} />
                                ))}
                            </div>
                        )}
                        {footerConfig.showNewsletter && (
                            <form
                                className="flex gap-2 pt-2"
                                onSubmit={e => e.preventDefault()}
                            >
                                <input
                                    type="email"
                                    placeholder="Seu e-mail"
                                    className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 ring-primary/40"
                                />
                                <button
                                    type="submit"
                                    className="rounded-lg px-3 py-2 text-xs font-bold whitespace-nowrap"
                                    style={{ backgroundColor: primaryColor, color: getContrastTextColor(primaryColor) }}
                                >
                                    Inscrever
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Link groups */}
                    {hasLinkGroups && (
                        <div className={cn(
                            'grid gap-8',
                            footerConfig.linkGroups.length === 1 && 'grid-cols-1',
                            footerConfig.linkGroups.length === 2 && 'grid-cols-2',
                            footerConfig.linkGroups.length >= 3 && 'grid-cols-2 sm:grid-cols-3',
                        )}>
                            {footerConfig.linkGroups.map((group: FooterLinkGroup) => (
                                <div key={group.title}>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3">
                                        {group.title}
                                    </p>
                                    <ul className="space-y-2">
                                        {group.links.map(link => (
                                            <li key={link.url}>
                                                <Link
                                                    href={link.url}
                                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {link.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Container>

            <div className="border-t border-border/40">
                <Container className="py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground/60">
                    <span>{copyright}</span>
                    {navPages.length > 0 && (
                        <div className="flex items-center gap-4">
                            {navPages.slice(0, 4).map(p => (
                                <Link
                                    key={p.id}
                                    href={p.isHomepage ? `/s/${siteSlug}` : `/s/${siteSlug}/${p.slug}`}
                                    className="hover:text-muted-foreground transition-colors"
                                >
                                    {p.navLabel ?? p.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </Container>
            </div>
        </footer>
    )
}

'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { ChatWidget } from '@/components/crm/ChatWidget'
import { SectionRenderer } from '@/components/landing-sections'
import type { LandingPageSection } from '@/domain/entities'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface LandingPageConfig {
    theme: 'light' | 'dark'
    primaryColor: string
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
    const { config } = page
    const isDark = config.theme === 'dark'
    const hasSections = config.sections && config.sections.length > 0

    useEffect(() => {
        fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                landingPageId: page.id,
                eventType: 'view',
                visitorId: getVisitorId(),
            }),
        }).catch(() => {})
    }, [page.id])

    const handleCtaClick = () => {
        fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                landingPageId: page.id,
                eventType: 'cta_click',
                visitorId: getVisitorId(),
            }),
        }).catch(() => {})
    }

    return (
        <div className={cn('min-h-screen bg-background text-foreground', isDark && 'dark')}>
            <div className="min-h-screen bg-background text-foreground">
                {hasSections ? (
                    <SectionRenderer
                        sections={config.sections}
                        primaryColor={config.primaryColor}
                        isDark={isDark}
                        landingPageId={page.id}
                        onCtaClick={handleCtaClick}
                    />
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
                                    style={{ backgroundColor: config.primaryColor, borderColor: config.primaryColor }}
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
                    <p>Powered by <span className="font-semibold text-foreground">Antigravity</span></p>
                </footer>
            </div>

            {/* Chat Widget */}
            <ChatWidget
                pageId={page.id}
                chatbotName={page.chatbotName}
                welcomeMessage={page.chatbotWelcomeMessage}
                primaryColor={config.primaryColor}
            />
        </div>
    )
}

'use client'

import { useEffect } from 'react'
import { ChatWidget } from '@/components/crm/ChatWidget'
import { SectionRenderer } from '@/components/landing-sections'
import type { LandingPageSection } from '@/domain/entities'

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
        <div className={`min-h-screen ${isDark ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
            {hasSections ? (
                <SectionRenderer
                    sections={config.sections}
                    primaryColor={config.primaryColor}
                    isDark={isDark}
                    landingPageId={page.id}
                    onCtaClick={handleCtaClick}
                />
            ) : (
                /* Fallback: layout clássico para páginas sem seções configuradas */
                <>
                    {/* Hero */}
                    <header className={`relative overflow-hidden ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
                        <div
                            className="absolute inset-0"
                            style={{
                                background: `radial-gradient(ellipse 90% 60% at 50% -5%, ${config.primaryColor}18 0%, transparent 65%)`,
                            }}
                        />
                        <div className={`absolute inset-0 bg-dot-grid ${isDark ? 'opacity-[0.04]' : 'opacity-[0.035]'}`} />
                        <div className="relative max-w-5xl mx-auto px-6 py-28 md:py-36 text-center">
                            {config.logoUrl && (
                                <img
                                    src={config.logoUrl}
                                    alt={page.name}
                                    className="h-12 mx-auto mb-10 object-contain"
                                />
                            )}
                            <h1 className={`text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] mb-6 text-balance ${
                                isDark ? 'text-white' : 'text-gray-950'
                            }`}>
                                {page.headline}
                            </h1>
                            {page.subheadline && (
                                <p className={`text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed text-pretty ${
                                    isDark ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                    {page.subheadline}
                                </p>
                            )}
                            <button
                                onClick={handleCtaClick}
                                className="group inline-flex items-center gap-2.5 px-7 py-3.5 text-base font-semibold rounded-xl text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                                style={{
                                    backgroundColor: config.primaryColor,
                                    boxShadow: `0 8px 24px -4px ${config.primaryColor}55`,
                                }}
                            >
                                {page.ctaText}
                                <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                            </button>
                        </div>
                    </header>

                    {/* Features strip */}
                    <section className={`py-20 ${isDark ? 'bg-gray-900/60' : 'bg-gray-50/80'}`}>
                        <div className="max-w-5xl mx-auto px-6 text-center">
                            <h2 className={`text-2xl md:text-3xl font-black tracking-tight mb-3 ${
                                isDark ? 'text-white' : 'text-gray-950'
                            }`}>
                                Como podemos ajudar?
                            </h2>
                            <p className={`text-base mb-12 max-w-lg mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Converse com nosso assistente para saber mais sobre nossos produtos e serviços.
                            </p>
                            <div className="grid md:grid-cols-3 gap-5">
                                {[
                                    { title: 'Atendimento Instantâneo', desc: 'Respostas imediatas 24/7 pelo chat' },
                                    { title: 'Informações Precisas', desc: 'Base de conhecimento completa sobre nossos serviços' },
                                    { title: 'Contato Direto', desc: 'Fale conosco e receba uma proposta personalizada' },
                                ].map((item) => (
                                    <div
                                        key={item.title}
                                        className={`p-6 rounded-2xl border transition-all duration-200 hover:-translate-y-1 ${
                                            isDark
                                                ? 'bg-gray-800/70 border-gray-700/60 hover:border-gray-600'
                                                : 'bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-md'
                                        }`}
                                    >
                                        <h3 className={`font-semibold text-base mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {item.title}
                                        </h3>
                                        <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {item.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </>
            )}

            {/* Footer */}
            <footer className={`py-8 text-center text-sm border-t ${
                isDark ? 'text-gray-600 border-gray-800' : 'text-gray-400 border-gray-100'
            }`}>
                <p>Powered by <span className="font-semibold">Antigravity</span></p>
            </footer>

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

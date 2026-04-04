'use client'

import type {
    LandingPageSection, SectionType,
    HeroContent, FeaturesContent, TestimonialsContent, FaqContent,
    PricingContent, ContactFormContent, CtaBannerContent, VideoContent,
    StatsContent, LogoCloudContent, GalleryContent,
} from '@/domain/entities'
import type { ColorPalette } from '@/domain/value-objects/design-system'
import { HeroSection } from './HeroSection'
import { FeaturesSection } from './FeaturesSection'
import { TestimonialsSection } from './TestimonialsSection'
import { FaqSection } from './FaqSection'
import { PricingSection } from './PricingSection'
import { ContactFormSection } from './ContactFormSection'
import { CtaBannerSection } from './CtaBannerSection'
import { VideoSection } from './VideoSection'
import { StatsSection } from './StatsSection'
import { LogoCloudSection } from './LogoCloudSection'
import { GallerySection } from './GallerySection'

interface SectionRendererProps {
    sections: LandingPageSection[]
    primaryColor: string
    palette?: ColorPalette
    isDark: boolean
    landingPageId: string
    onCtaClick?: () => void
}

export function SectionRenderer({ sections, primaryColor, palette, isDark, landingPageId, onCtaClick }: SectionRendererProps) {
    const sorted = [...sections]
        .filter(s => s.visible !== false)
        .sort((a, b) => a.order - b.order)

    // Build resolved palette: use explicit palette or derive from primaryColor
    const resolvedPalette: ColorPalette = palette ?? {
        primary: primaryColor,
        secondary: primaryColor,
        accent: primaryColor,
        background: isDark ? '#0f0f23' : '#fafbfc',
        foreground: isDark ? '#f1f5f9' : '#0f172a',
        muted: isDark ? '#64748b' : '#94a3b8',
    }

    return (
        <>
            {sorted.map((section) => (
                <SectionBlock
                    key={section.id}
                    section={section}
                    primaryColor={primaryColor}
                    palette={resolvedPalette}
                    isDark={isDark}
                    landingPageId={landingPageId}
                    onCtaClick={onCtaClick}
                />
            ))}
        </>
    )
}

function SectionBlock({
    section,
    primaryColor,
    palette,
    isDark,
    landingPageId,
    onCtaClick,
}: {
    section: LandingPageSection
    primaryColor: string
    palette: ColorPalette
    isDark: boolean
    landingPageId: string
    onCtaClick?: () => void
}) {
    const type = section.type as SectionType

    switch (type) {
        case 'hero':
            return <HeroSection content={section.content as HeroContent} primaryColor={primaryColor} palette={palette} isDark={isDark} onCtaClick={onCtaClick} />
        case 'features':
            return <FeaturesSection content={section.content as FeaturesContent} primaryColor={primaryColor} palette={palette} isDark={isDark} />
        case 'testimonials':
            return <TestimonialsSection content={section.content as TestimonialsContent} primaryColor={primaryColor} palette={palette} isDark={isDark} />
        case 'faq':
            return <FaqSection content={section.content as FaqContent} primaryColor={primaryColor} palette={palette} isDark={isDark} />
        case 'pricing':
            return <PricingSection content={section.content as PricingContent} primaryColor={primaryColor} palette={palette} isDark={isDark} />
        case 'contact_form':
            return <ContactFormSection content={section.content as ContactFormContent} primaryColor={primaryColor} palette={palette} isDark={isDark} landingPageId={landingPageId} />
        case 'cta_banner':
            return <CtaBannerSection content={section.content as CtaBannerContent} primaryColor={primaryColor} palette={palette} isDark={isDark} />
        case 'video':
            return <VideoSection content={section.content as VideoContent} isDark={isDark} primaryColor={primaryColor} />
        case 'stats':
            return <StatsSection content={section.content as StatsContent} primaryColor={primaryColor} palette={palette} isDark={isDark} />
        case 'logo_cloud':
            return <LogoCloudSection content={section.content as LogoCloudContent} isDark={isDark} />
        case 'gallery':
            return <GallerySection content={section.content as GalleryContent} isDark={isDark} />
        default:
            return null
    }
}

import { z } from 'zod'
import { SECTION_LABELS, type SectionType } from '@/domain/entities'

export const heroContentSchema = z.object({
    kicker: z.string().default('Oferta especial por tempo limitado'),
    headline: z.string(),
    subheadline: z.string(),
    ctaText: z.string(),
    ctaUrl: z.string().default('#'),
    backgroundImageUrl: z.string().nullable().default(null),
    heroImageUrl: z.string().nullable().default(null),
    layout: z.enum(['background', 'split']).default('split'),
    trustBadges: z.array(z.string()).max(6).default([]),
    alignment: z.enum(['center', 'left']).default('center'),
})

export const featureItemSchema = z.object({
    icon: z.string().min(1),
    title: z.string(),
    description: z.string(),
})

export const featuresContentSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    columns: z.number().int().min(2).max(4).default(3),
    items: z.array(featureItemSchema).min(2).max(6),
})

export const benefitsGridContentSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    items: z.array(
        z.object({
            title: z.string(),
            description: z.string(),
        })
    ).min(3).max(6),
})

export const processStepsContentSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    steps: z.array(
        z.object({
            title: z.string(),
            description: z.string(),
        })
    ).min(3).max(5),
})

export const testimonialItemSchema = z.object({
    name: z.string(),
    role: z.string(),
    company: z.string(),
    avatarUrl: z.string().nullable().default(null),
    quote: z.string(),
    rating: z.number().min(1).max(5),
})

export const testimonialsContentSchema = z.object({
    title: z.string(),
    items: z.array(testimonialItemSchema).min(1).max(6),
})

export const faqItemSchema = z.object({
    question: z.string(),
    answer: z.string(),
})

export const faqContentSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    items: z.array(faqItemSchema).min(2).max(8),
})

export const pricingTierSchema = z.object({
    name: z.string(),
    price: z.string(),
    period: z.string(),
    description: z.string(),
    features: z.array(z.string()).min(1).max(8),
    ctaText: z.string(),
    highlighted: z.boolean(),
})

export const pricingContentSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    tiers: z.array(pricingTierSchema).min(1).max(4),
})

export const contactFormContentSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    fields: z.array(z.enum(['name', 'email', 'phone', 'company', 'message'])),
    submitText: z.string(),
    successMessage: z.string(),
})

export const ctaBannerContentSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    ctaText: z.string(),
    ctaUrl: z.string().default('#'),
})

export const videoContentSchema = z.object({
    title: z.string(),
    videoUrl: z.string().default(''),
    provider: z.enum(['youtube', 'vimeo']).default('youtube'),
})

export const statItemSchema = z.object({
    value: z.string(),
    label: z.string(),
})

export const statsContentSchema = z.object({
    title: z.string(),
    items: z.array(statItemSchema).min(2).max(6),
})

export const logoCloudContentSchema = z.object({
    title: z.string(),
    logos: z.array(
        z.object({
            name: z.string(),
            imageUrl: z.string(),
        })
    ).max(8).default([]),
})

export const galleryContentSchema = z.object({
    title: z.string(),
    images: z.array(
        z.object({
            url: z.string(),
            alt: z.string(),
        })
    ).max(8).default([]),
    columns: z.number().int().min(2).max(4).default(3),
})

export const sectionSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('hero'), content: heroContentSchema }),
    z.object({ type: z.literal('features'), content: featuresContentSchema }),
    z.object({ type: z.literal('benefits_grid'), content: benefitsGridContentSchema }),
    z.object({ type: z.literal('process_steps'), content: processStepsContentSchema }),
    z.object({ type: z.literal('testimonials'), content: testimonialsContentSchema }),
    z.object({ type: z.literal('faq'), content: faqContentSchema }),
    z.object({ type: z.literal('pricing'), content: pricingContentSchema }),
    z.object({ type: z.literal('contact_form'), content: contactFormContentSchema }),
    z.object({ type: z.literal('cta_banner'), content: ctaBannerContentSchema }),
    z.object({ type: z.literal('video'), content: videoContentSchema }),
    z.object({ type: z.literal('stats'), content: statsContentSchema }),
    z.object({ type: z.literal('logo_cloud'), content: logoCloudContentSchema }),
    z.object({ type: z.literal('gallery'), content: galleryContentSchema }),
])

export const generateResponseSchema = z.object({
    sections: z.array(sectionSchema).min(2).max(10),
})

export const availableSectionTypes = [
    'hero',
    'features',
    'benefits_grid',
    'process_steps',
    'testimonials',
    'faq',
    'pricing',
    'contact_form',
    'cta_banner',
    'video',
    'stats',
    'logo_cloud',
    'gallery',
] as const

export const looseGenerateResponseSchema = z.object({
    sections: z.array(z.object({
        type: z.enum(availableSectionTypes),
        content: z.record(z.string(), z.unknown()).default({}),
    })).min(2).max(10),
})

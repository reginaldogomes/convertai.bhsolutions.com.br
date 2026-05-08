import { DEFAULT_SECTION_CONTENT } from '@/domain/entities'
import { generateNanoBananaImageDataUrl } from '../nano-banana'
import type { GeneratedSection, LandingPageGenerationInput } from './types'
import { escapeXml } from './utils'

export async function enrichSectionsWithImages(sections: GeneratedSection[], input: LandingPageGenerationInput): Promise<GeneratedSection[]> {
    if (!input.imageGeneration?.enabled) {
        return sections
    }

    const model = input.imageGeneration.model ?? 'gemini-2.5-flash-image'
    const cloned = sections.map((section) => ({ ...section, content: { ...section.content } }))
    const hero = cloned.find((section) => section.type === 'hero')

    if (hero) {
        const heroContent = hero.content as {
            headline?: string
            subheadline?: string
            backgroundImageUrl?: string | null
            heroImageUrl?: string | null
            layout?: 'background' | 'split'
        }
        const heroLayout = heroContent.layout === 'background' ? 'background' : 'split'

        const heroBackgroundPrompt = [
            'Crie uma imagem publicitária premium para background de hero de landing page, sem texto na imagem.',
            heroContent.headline ?? '',
            heroContent.subheadline ?? '',
            input.prompt,
            'Estilo fotográfico realista, iluminação cinematográfica e composição ampla.',
        ].filter(Boolean).join(' ')

        const heroSidePrompt = [
            'Crie uma ilustração/foto premium para hero de landing page com composição lateral, sem texto.',
            heroContent.headline ?? '',
            heroContent.subheadline ?? '',
            input.prompt,
            'Assunto principal bem recortado, visual clean e foco em conversão.',
        ].filter(Boolean).join(' ')

        if (heroLayout === 'background' && !heroContent.backgroundImageUrl) {
            const generatedHeroBackground = await generateNanoBananaImageDataUrl({
                model,
                prompt: heroBackgroundPrompt,
                aspectRatio: '16:9',
            })

            heroContent.backgroundImageUrl = generatedHeroBackground ?? createFallbackIllustrationDataUrl({
                title: heroContent.headline ?? 'Oferta especial',
                subtitle: heroContent.subheadline ?? input.prompt,
                aspectRatio: '16:9',
            })
        }

        if (heroLayout === 'split' && !heroContent.heroImageUrl) {
            const generatedHeroSide = await generateNanoBananaImageDataUrl({
                model,
                prompt: heroSidePrompt,
                aspectRatio: '4:3',
            })

            heroContent.heroImageUrl = generatedHeroSide ?? createFallbackIllustrationDataUrl({
                title: heroContent.headline ?? 'Oferta especial',
                subtitle: heroContent.subheadline ?? input.prompt,
                aspectRatio: '4:3',
            })
        }

        hero.content = heroContent as Record<string, unknown>
    }

    let gallery = cloned.find((section) => section.type === 'gallery')
    if (!gallery && cloned.length < 10) {
        const candidateIndex = cloned.findIndex((section) =>
            section.type === 'testimonials' ||
            section.type === 'faq' ||
            section.type === 'cta_banner' ||
            section.type === 'contact_form'
        )
        const insertionIndex = candidateIndex >= 0 ? candidateIndex : Math.max(1, cloned.length - 1)

        const newGallery: GeneratedSection = {
            type: 'gallery',
            content: {
                ...DEFAULT_SECTION_CONTENT.gallery,
                title: 'Destaques visuais da solução',
            },
        }

        cloned.splice(insertionIndex, 0, newGallery)
        gallery = newGallery
    }

    if (gallery) {
        const galleryContent = gallery.content as {
            title?: string
            images?: Array<{ url: string; alt: string }>
            columns?: 2 | 3 | 4
        }

        const existing = Array.isArray(galleryContent.images) ? galleryContent.images.filter((item) => !!item?.url) : []
        if (existing.length < 2) {
            const promptBase = [
                'Imagem de destaque para seção visual de landing page, sem textos e sem logos.',
                input.prompt,
                hero?.content?.headline ? String((hero.content as Record<string, unknown>).headline) : '',
            ].filter(Boolean).join(' ')

            const generatedGalleryImages: Array<{ url: string; alt: string }> = [...existing]
            while (generatedGalleryImages.length < 3) {
                const image = await generateNanoBananaImageDataUrl({
                    model,
                    prompt: `${promptBase} Variação visual ${generatedGalleryImages.length + 1}.`,
                    aspectRatio: '4:3',
                })

                if (!image) {
                    generatedGalleryImages.push({
                        url: createFallbackIllustrationDataUrl({
                            title: galleryContent.title || 'Destaque visual',
                            subtitle: `${input.prompt.slice(0, 50)} • variação ${generatedGalleryImages.length + 1}`,
                            aspectRatio: '4:3',
                        }),
                        alt: `Ilustração de destaque ${generatedGalleryImages.length + 1}`,
                    })
                    continue
                }

                generatedGalleryImages.push({
                    url: image,
                    alt: `Imagem de destaque ${generatedGalleryImages.length + 1}`,
                })
            }

            gallery.content = {
                title: galleryContent.title || 'Veja o que torna essa solução diferente',
                columns: galleryContent.columns ?? 3,
                images: generatedGalleryImages,
            }
        }
    }

    return cloned
}

export function createFallbackIllustrationDataUrl(input: {
    title: string
    subtitle?: string
    aspectRatio: '16:9' | '4:3'
}): string {
    const size = input.aspectRatio === '16:9'
            ? { width: 1600, height: 900 }
            : { width: 1200, height: 900 }

    const title = escapeXml(input.title.slice(0, 80))
    const subtitle = escapeXml((input.subtitle ?? '').slice(0, 120))

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">
<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="55%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#334155"/>
    </linearGradient>
    <radialGradient id="orb1" cx="0.2" cy="0.25" r="0.6">
        <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.32"/>
        <stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="orb2" cx="0.82" cy="0.8" r="0.5">
        <stop offset="0%" stop-color="#a78bfa" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="#a78bfa" stop-opacity="0"/>
    </radialGradient>
</defs>
<rect width="100%" height="100%" fill="url(#bg)"/>
<rect width="100%" height="100%" fill="url(#orb1)"/>
<rect width="100%" height="100%" fill="url(#orb2)"/>
<g opacity="0.18" stroke="#e2e8f0" stroke-width="1">
    <path d="M0 ${Math.round(size.height * 0.7)} H${size.width}"/>
    <path d="M0 ${Math.round(size.height * 0.8)} H${size.width}"/>
    <path d="M0 ${Math.round(size.height * 0.9)} H${size.width}"/>
</g>
<text x="80" y="${Math.round(size.height * 0.68)}" fill="#f8fafc" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="54" font-weight="700">${title}</text>
<text x="80" y="${Math.round(size.height * 0.76)}" fill="#cbd5e1" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="28">${subtitle}</text>
</svg>`

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

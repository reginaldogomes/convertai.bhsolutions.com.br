import { NextResponse } from 'next/server'
import { z } from 'zod'
import { landingPageRepo, analyticsRepo, contactRepo } from '@/application/services/container'

const leadSchema = z.object({
    landingPageId: z.string().uuid('Landing page inválida'),
    name: z.string().min(2, 'Nome obrigatório'),
    email: z.string().email('Email inválido'),
    phone: z.string().optional().or(z.literal('')),
    company: z.string().optional().or(z.literal('')),
    message: z.string().optional().or(z.literal('')),
    consent: z.literal(true, { errorMap: () => ({ message: 'Consentimento obrigatório' }) }),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const parsed = leadSchema.safeParse(body)

        if (!parsed.success) {
            const message = parsed.error.issues[0]?.message ?? 'Dados inválidos'
            return NextResponse.json({ error: message }, { status: 400 })
        }

        const { landingPageId, name, email, phone, company, message } = parsed.data

        const page = await landingPageRepo.findById(landingPageId)
        if (!page) {
            return NextResponse.json({ error: 'Landing page não encontrada' }, { status: 404 })
        }

        // Deduplicate by email within the org
        const existing = await contactRepo.findByEmail(email, page.organizationId)

        let contactId: string

        if (existing) {
            contactId = existing.id
            // Update with any new info provided
            await contactRepo.update(contactId, {
                name: name || existing.name,
                phone: phone || existing.phone || null,
                company: company || existing.company || null,
                // Merge tags preserving existing ones + add landing_page tag
                tags: Array.from(new Set([...existing.tags, 'landing_page'])),
                // Append new message as note if provided
                notes: message
                    ? `${existing.notes ? existing.notes + '\n\n' : ''}[Landing Page: ${page.name}]\n${message}`
                    : existing.notes,
            })
        } else {
            const newContact = await contactRepo.create({
                organizationId: page.organizationId,
                name,
                email,
                phone: phone || null,
                company: company || null,
                tags: ['landing_page'],
                notes: message ? `[Landing Page: ${page.name}]\n${message}` : `Via Landing Page: ${page.name}`,
            })
            if (!newContact) {
                return NextResponse.json({ error: 'Erro ao registrar contato' }, { status: 500 })
            }
            contactId = newContact.id
        }

        await analyticsRepo.track({
            landingPageId,
            eventType: 'lead_captured',
            visitorId: undefined,
            metadata: { contactId, source: 'contact_form' },
        })

        return NextResponse.json({ success: true, contactId })
    } catch {
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
    }
}

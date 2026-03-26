import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { landingPageRepo, analyticsRepo } from '@/application/services/container'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { landingPageId, name, email, phone, company, message } = body as {
            landingPageId?: string
            name?: string
            email?: string
            phone?: string
            company?: string
            message?: string
        }

        if (!landingPageId || !email) {
            return NextResponse.json({ error: 'landingPageId and email are required' }, { status: 400 })
        }

        // Save lead as contact in the CRM
        const page = await landingPageRepo.findById(landingPageId)
        if (!page) {
            return NextResponse.json({ error: 'Landing page not found' }, { status: 404 })
        }

        const supabase = createAdminClient()

        // Check if contact already exists for this org
        const { data: existing } = await supabase
            .from('contacts')
            .select('id')
            .eq('organization_id', page.organizationId)
            .eq('email', email)
            .single()

        let contactId: string

        if (existing) {
            contactId = existing.id
            // Update existing contact with any new info
            const updateData: Record<string, string> = {}
            if (name) updateData.name = name
            if (phone) updateData.phone = phone
            if (company) updateData.company = company
            if (Object.keys(updateData).length > 0) {
                await supabase
                    .from('contacts')
                    .update(updateData)
                    .eq('id', contactId)
            }
        } else {
            // Create new contact
            const { data: newContact } = await supabase
                .from('contacts')
                .insert({
                    organization_id: page.organizationId,
                    name: name || email.split('@')[0],
                    email,
                    phone: phone || null,
                    company: company || null,
                    source: 'landing_page',
                    notes: message ? `[Landing Page: ${page.name}]\n${message}` : `Via Landing Page: ${page.name}`,
                })
                .select('id')
                .single()

            contactId = newContact?.id ?? ''
        }

        // Track lead capture event
        await analyticsRepo.track({
            landingPageId,
            eventType: 'lead_captured',
            visitorId: undefined,
            metadata: { contactId, source: 'contact_form' },
        })

        return NextResponse.json({ success: true, contactId })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

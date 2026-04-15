import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSiteUrl } from '@/lib/site-url'

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const isPopup = searchParams.get('popup') === '1'

    const errorRedirect = (key: string) =>
        isPopup
            ? NextResponse.redirect(`${getSiteUrl()}/auth/popup-close?error=${key}`)
            : NextResponse.redirect(`${getSiteUrl()}/login?error=${key}`)

    const successRedirect = () =>
        isPopup
            ? NextResponse.redirect(`${getSiteUrl()}/auth/popup-close`)
            : NextResponse.redirect(`${getSiteUrl()}/`)

    if (error) return errorRedirect(encodeURIComponent(error))
    if (!code) return errorRedirect('missing_code')

    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError || !data.user) return errorRedirect('auth_failed')

    const user = data.user

    const admin = createAdminClient()
    const { data: existingProfile } = await admin
        .from('users')
        .select('id, organization_id')
        .eq('id', user.id)
        .single()

    if (existingProfile?.organization_id) return successRedirect()

    // Novo usuário — nome a partir de metadados do convite ou do OAuth
    const name =
        (user.user_metadata?.full_name as string | undefined)?.trim() ||
        (user.user_metadata?.name as string | undefined)?.trim() ||
        user.email?.split('@')[0] ||
        'Usuário'

    // ── Fluxo de convite: usuário foi convidado para uma org existente ──────────
    const invitedOrgId = user.user_metadata?.invited_org_id as string | undefined
    const invitedRole  = (user.user_metadata?.invited_role as string | undefined) ?? 'agent'

    if (invitedOrgId) {
        // Confirmar que a org ainda existe
        const { data: org } = await admin
            .from('organizations')
            .select('id')
            .eq('id', invitedOrgId)
            .single()

        if (!org) {
            console.error('[auth/callback] Org convidada não encontrada:', invitedOrgId)
            return errorRedirect('invite_org_not_found')
        }

        const { error: userError } = await admin.from('users').insert({
            id: user.id,
            organization_id: invitedOrgId,
            name,
            email: user.email ?? '',
            role: invitedRole,
        })

        if (userError) {
            console.error('[auth/callback] Falha ao provisionar usuário convidado:', userError)
            return errorRedirect('provisioning_failed')
        }

        return successRedirect()
    }

    // ── Fluxo padrão: novo usuário cria sua própria organização ───────────────
    const orgName = `${name}'s Workspace`

    const { data: org, error: orgError } = await admin
        .from('organizations')
        .insert({ name: orgName })
        .select('id')
        .single()

    if (orgError || !org) {
        console.error('[auth/callback] Falha ao criar organização para usuário OAuth:', orgError)
        return errorRedirect('provisioning_failed')
    }

    const { error: userError } = await admin.from('users').insert({
        id: user.id,
        organization_id: org.id,
        name,
        email: user.email ?? '',
        role: 'owner',
    })

    if (userError) {
        console.error('[auth/callback] Falha ao criar perfil para usuário OAuth:', userError)
        await admin.from('organizations').delete().eq('id', org.id)
        return errorRedirect('provisioning_failed')
    }

    return successRedirect()
}

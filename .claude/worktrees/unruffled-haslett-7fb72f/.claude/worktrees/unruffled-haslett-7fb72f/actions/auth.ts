'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getSiteUrl } from '@/lib/site-url'

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export async function login(prevState: { error: string }, formData: FormData) {
    const parsed = loginSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
    })
    if (!parsed.success) return { error: 'Dados inválidos' }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword(parsed.data)

    if (error) return { error: error.message }
    redirect('/')
}

const registerSchema = z.object({
    name: z.string().min(2),
    orgName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
})

export async function register(prevState: { error: string }, formData: FormData) {
    const parsed = registerSchema.safeParse({
        name: formData.get('name'),
        orgName: formData.get('orgName'),
        email: formData.get('email'),
        password: formData.get('password'),
    })
    if (!parsed.success) return { error: 'Dados inválidos' }

    const supabase = await createClient()
    const { orgName, ...credentials } = parsed.data

    // 1. Create auth user
    const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: { data: { name: credentials.name } },
    })

    if (error) return { error: error.message }
    if (!data.user) return { error: 'Falha ao criar usuário' }

    // 2. Create org + user profile via service role (bypasses RLS)
    const admin = createAdminClient()

    const { data: org, error: orgError } = await admin
        .from('organizations')
        .insert({ name: orgName })
        .select()
        .single()

    if (orgError || !org) {
        console.error('Erro ao criar organização:', orgError)
        return { error: 'Falha ao criar organização. Tente novamente.' }
    }

    const { error: userError } = await admin.from('users').insert({
        id: data.user.id,
        organization_id: org.id,
        name: credentials.name,
        email: credentials.email,
        role: 'owner',
    })

    if (userError) {
        console.error('Erro ao criar perfil:', userError)
        // Rollback: remove a org órfã
        await admin.from('organizations').delete().eq('id', org.id)
        return { error: 'Falha ao criar perfil. Tente novamente.' }
    }

    redirect('/')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}

export async function loginWithGoogle() {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${getSiteUrl()}/auth/callback`,
            queryParams: { access_type: 'offline', prompt: 'consent' },
        },
    })
    if (error || !data.url) redirect('/login?error=oauth')
    redirect(data.url)
}

export async function getGoogleOAuthUrl(): Promise<{ url: string | null; error: string | null }> {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${getSiteUrl()}/auth/callback?popup=1`,
            queryParams: { access_type: 'offline', prompt: 'consent' },
            skipBrowserRedirect: true,
        },
    })
    if (error || !data.url) return { url: null, error: 'Erro ao iniciar autenticação com Google.' }
    return { url: data.url, error: null }
}

export async function forgotPassword(prevState: { error: string; success: boolean }, formData: FormData) {
    const email = formData.get('email') as string
    if (!email) return { error: 'Email obrigatório', success: false }

    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    })

    if (error) return { error: error.message, success: false }
    return { error: '', success: true }
}

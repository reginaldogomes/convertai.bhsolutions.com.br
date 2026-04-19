import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from './lib/supabase/admin'

export async function proxy(request: NextRequest) {
    const url = request.nextUrl
    // Use `nextUrl.hostname` para obter o host sem a porta,
    // evitando loops de redirecionamento em ambiente de desenvolvimento (localhost).
    // O header 'host' pode incluir a porta (ex: 'localhost:3000'), causando a falha na comparação.
    const hostname = url.hostname
    const pathname = url.pathname

    // Domínio principal da aplicação (ex: app.convertai.com.br)
    const appDomain = new URL(process.env.NEXT_PUBLIC_APP_URL!).hostname

    // Se não for o domínio principal, é um potencial domínio customizado
    if (hostname !== appDomain) {
        const admin = createAdminClient()
        // Lógica atualizada para buscar o site e suas páginas
        const { data: domainData } = await admin
            .from('custom_domains')
            .select('site_id, sites(landing_pages(slug, is_homepage))')
            .eq('domain', hostname)
            .eq('status', 'active')
            .maybeSingle()

        // O Supabase retorna 'sites' como um objeto se for to-one, ou array se for to-many.
        // Normalizamos para um objeto para segurança.
        const site = domainData?.sites ? (Array.isArray(domainData.sites) ? domainData.sites[0] : domainData.sites) : null

        if (site && Array.isArray(site.landing_pages)) {
            let pageToRender: { slug: string } | undefined;

            // Se o caminho for a raiz ('/'), procura a página marcada como homepage.
            if (pathname === '/') {
                pageToRender = site.landing_pages.find(p => p.is_homepage);
            } else {
                // Para outros caminhos (ex: '/sobre'), procura uma página com esse slug.
                const requestedSlug = pathname.replace(/^\//, '');
                pageToRender = site.landing_pages.find(p => p.slug === requestedSlug);
            }

            if (pageToRender) {
                // Reescreve a requisição para a rota interna da página pública (`/p/[slug]`),
                // mantendo a URL do domínio personalizado no navegador do usuário.
                return NextResponse.rewrite(new URL(`/p/${pageToRender.slug}`, request.url));
            }
        }

        // Por segurança, redirecionamos para o app principal.
        // Futuramente, pode-se exibir uma página 404 customizada do próprio site.
        return NextResponse.redirect(new URL(process.env.NEXT_PUBLIC_APP_URL!))
    }

    // Public landing routes and APIs must never require dashboard auth.
    const isPublicLandingRoute = pathname.startsWith('/p/')
    const isPublicLandingApi =
        pathname.startsWith('/api/chat/') ||
        pathname === '/api/analytics/track' ||
        pathname === '/api/landing-pages/lead'

    // A lógica abaixo é para o domínio principal da aplicação.
    // Se a rota for pública, pulamos a verificação de autenticação.
    if (isPublicLandingRoute || isPublicLandingApi) {
        return NextResponse.next({ request })
    }

    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll().filter(c => c.value !== '')
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    let user = null
    try {
        // getSession() reads the JWT from cookies without a network roundtrip (O(1) local decode).
        // getUser() would verify remotely with the Supabase Auth server on every request — too slow
        // for middleware. The actual security check (getUser) happens inside getAuthContext() in each
        // server component/action before any data is accessed.
        const { data } = await supabase.auth.getSession()
        user = data.session?.user ?? null
    } catch {
        // Supabase may throw if cookies contain invalid/empty auth tokens
    }

    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/register') ||
        request.nextUrl.pathname.startsWith('/forgot-password')

    if (!user && !isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (user && isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    // Expire empty sb-* cookies so the browser stops sending them
    for (const cookie of request.cookies.getAll()) {
        if (cookie.name.startsWith('sb-') && cookie.value === '') {
            supabaseResponse.cookies.set(cookie.name, '', { maxAge: 0, path: '/' })
        }
    }

    return supabaseResponse
}

export default proxy

export const config = {
    matcher: [
        // Corresponde a todos os caminhos de requisição, exceto arquivos estáticos, imagens, favicon e webhooks.
        // O middleware é executado em todas as outras rotas para lidar com domínios personalizados e autenticação.
        '/((?!_next/static|_next/image|favicon.ico|api/webhooks/).*)',
    ],
}

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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
        const { data } = await supabase.auth.getUser()
        user = data.user
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
        '/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)',
    ],
}

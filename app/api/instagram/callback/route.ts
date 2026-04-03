import { NextResponse } from 'next/server'
import { getAuthContext } from '@/infrastructure/auth'
import { instagramAccountRepo, instagramService } from '@/application/services/container'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET(request: Request) {
    try {
        const { orgId } = await getAuthContext()
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')
        const errorParam = searchParams.get('error')

        // User denied permissions
        if (errorParam) {
            return NextResponse.redirect(`${APP_URL}/instagram?error=user_denied`)
        }

        if (!code) {
            return NextResponse.redirect(`${APP_URL}/instagram?error=no_code`)
        }

        const redirectUri = `${APP_URL}/api/instagram/callback`

        // Step 1: Exchange code for short-lived user access token
        const tokenResult = await instagramService.exchangeCodeForToken(code, redirectUri)
        if (!tokenResult) {
            return NextResponse.redirect(`${APP_URL}/instagram?error=token_exchange_failed`)
        }

        // Step 2: Get long-lived token
        const longToken = await instagramService.getLongLivedToken(tokenResult.access_token)
        if (!longToken) {
            return NextResponse.redirect(`${APP_URL}/instagram?error=long_token_failed`)
        }

        // Step 3: Discover Instagram Business Account from Pages
        const igAccount = await instagramService.getInstagramBusinessAccount(longToken.access_token)
        if (!igAccount) {
            return NextResponse.redirect(`${APP_URL}/instagram?error=no_ig_account`)
        }

        // Step 4: Store account data
        const expiresAt = new Date(Date.now() + longToken.expires_in * 1000).toISOString()

        await instagramAccountRepo.upsert(orgId, {
            ig_user_id: igAccount.ig_user_id,
            ig_username: igAccount.ig_username,
            access_token: igAccount.page_access_token,
            token_expires_at: expiresAt,
            page_id: igAccount.page_id,
            followers_count: igAccount.followers_count,
            media_count: igAccount.media_count,
        })

        return NextResponse.redirect(`${APP_URL}/instagram?connected=true`)
    } catch (error) {
        console.error('[Instagram Callback] Error:', error)
        return NextResponse.redirect(`${APP_URL}/instagram?error=unknown`)
    }
}

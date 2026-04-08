import { NextResponse } from 'next/server'
import { getAuthContext } from '@/infrastructure/auth'
import { instagramAccountRepo, instagramService } from '@/application/services/container'
import { createApiRequestLogger } from '@/lib/api-observability'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET(request: Request) {
    const logger = createApiRequestLogger('instagram/callback')

    try {
        logger.log('request_received')
        const { orgId } = await getAuthContext()
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')
        const errorParam = searchParams.get('error')

        // User denied permissions
        if (errorParam) {
            return NextResponse.redirect(`${APP_URL}/instagram?error=user_denied&requestId=${logger.requestId}`)
        }

        if (!code) {
            return NextResponse.redirect(`${APP_URL}/instagram?error=no_code&requestId=${logger.requestId}`)
        }

        const redirectUri = `${APP_URL}/api/instagram/callback`

        // Step 1: Exchange code for short-lived user access token
        const tokenResult = await instagramService.exchangeCodeForToken(code, redirectUri)
        if (!tokenResult) {
            return NextResponse.redirect(`${APP_URL}/instagram?error=token_exchange_failed&requestId=${logger.requestId}`)
        }

        // Step 2: Get long-lived token
        const longToken = await instagramService.getLongLivedToken(tokenResult.access_token)
        if (!longToken) {
            return NextResponse.redirect(`${APP_URL}/instagram?error=long_token_failed&requestId=${logger.requestId}`)
        }

        // Step 3: Discover Instagram Business Account from Pages
        const igAccount = await instagramService.getInstagramBusinessAccount(longToken.access_token)
        if (!igAccount) {
            return NextResponse.redirect(`${APP_URL}/instagram?error=no_ig_account&requestId=${logger.requestId}`)
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

        logger.log('instagram_connected', { orgId, igUserId: igAccount.ig_user_id })
        return NextResponse.redirect(`${APP_URL}/instagram?connected=true&requestId=${logger.requestId}`)
    } catch (error) {
        logger.error('callback_failed', error)
        return NextResponse.redirect(`${APP_URL}/instagram?error=unknown&requestId=${logger.requestId}`)
    }
}

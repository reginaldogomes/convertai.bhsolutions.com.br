'use server'

import { getAuthContext } from '@/infrastructure/auth'
import { useCases } from '@/application/services/container'
import { getErrorMessage } from './utils'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSiteUrl } from '@/lib/site-url'
import type Stripe from 'stripe'

export async function requestCreditPurchase(
    prevState: { error: string; success: boolean } | null,
    formData: FormData,
) {
    try {
        const { orgId, userId, profile } = await getAuthContext()
        const packId = formData.get('packId') as string
        if (!packId) return { error: 'Pacote não informado', success: false }

        const packsResult = await useCases.getCreditPacks().execute()
        if (!packsResult.ok) return { error: packsResult.error.message, success: false }

        const pack = packsResult.value.find((p) => p.id === packId)
        if (!pack) return { error: 'Pacote não encontrado', success: false }

        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('A chave secreta do Stripe não está configurada no ambiente.')
        }

        // Importação dinâmica para evitar que o 'stripe' seja empacotado no cliente.
        const StripeJS = (await import('stripe')).default
        const stripe = new StripeJS(process.env.STRIPE_SECRET_KEY)

        const siteUrl = getSiteUrl()

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            billing_address_collection: 'required',
            customer_email: profile.email,
            line_items: [
                {
                    price_data: {
                        currency: 'brl',
                        product_data: {
                            name: pack.name,
                            description: `${pack.credits} créditos para a plataforma Convert.AI`,
                        },
                        unit_amount: Math.round(pack.priceBrl * 100), // Stripe espera o valor em centavos. Arredondado para evitar erros de ponto flutuante.
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${siteUrl}/settings?tab=plan&purchase_success=true`,
            cancel_url: `${siteUrl}/settings?tab=plan&purchase_canceled=true`,
            metadata: {
                orgId,
                userId,
                packId,
            },
        })

        if (!session.url) {
            return {
                error: 'Não foi possível criar a sessão de pagamento. Tente novamente.',
                success: false,
            }
        }

        // Redireciona para a página de checkout do Stripe
        redirect(session.url)
    } catch (error) {
        return { error: getErrorMessage(error), success: false }
    }
}

export async function handleStripeWebhook(request: Request) {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('Stripe keys are not configured.')
        return new Response('Configuration error', { status: 500 })
    }

    const signature = (await headers()).get('stripe-signature')

    // Importação dinâmica para evitar que o 'stripe' seja empacotado no cliente.
    const StripeJS = (await import('stripe')).default
    const stripe = new StripeJS(process.env.STRIPE_SECRET_KEY)

    if (!signature) {
        return new Response('Webhook Error: Missing signature', { status: 400 })
    }

    let event: Stripe.Event
    try {
        const body = await request.text()
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error(`Webhook signature verification failed: ${message}`)
        return new Response(`Webhook Error: ${message}`, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session
        const { orgId, userId, packId } = session.metadata || {}
        if (!orgId || !userId || !packId) {
            console.error('Webhook Error: Missing metadata from checkout session', session.id)
            return new Response('Webhook Error: Missing metadata', { status: 400 })
        }
        try {
            const result = await useCases.grantCreditsFromPack().execute(orgId, userId, packId)
            if (!result.ok) {
                throw new Error(`Failed to grant credits: ${result.error.message}`)
            }
            console.log(`[Stripe Webhook] Successfully granted credits from pack ${packId} to org ${orgId}.`)
        } catch (error) {
            console.error(`[Stripe Webhook] Processing failed for session ${session.id}:`, error)
        }
    }

    return new Response(null, { status: 200 })
}
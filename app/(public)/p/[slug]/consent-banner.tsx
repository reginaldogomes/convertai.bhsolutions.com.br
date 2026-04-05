'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { hasStoredMarketingConsent, setMarketingConsent } from '@/lib/ads-attribution'

export function ConsentBanner() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        setVisible(!hasStoredMarketingConsent())
    }, [])

    if (!visible) return null

    const accept = () => {
        setMarketingConsent(true)
        setVisible(false)
    }

    const reject = () => {
        setMarketingConsent(false)
        setVisible(false)
    }

    return (
        <div className="fixed bottom-4 left-1/2 z-60 w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 rounded-xl border border-border bg-card p-4 shadow-xl">
            <p className="text-sm text-foreground">
                Usamos cookies e identificadores de campanha para medir conversões e melhorar anúncios. Você autoriza o uso para fins de marketing?
            </p>
            <div className="mt-3 flex items-center gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={reject}>
                    Recusar
                </Button>
                <Button type="button" size="sm" onClick={accept}>
                    Aceitar
                </Button>
            </div>
        </div>
    )
}

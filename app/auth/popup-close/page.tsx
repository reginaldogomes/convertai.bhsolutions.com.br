import { Suspense } from 'react'
import { PopupClosePageClient } from './popup-close-page-client'

export default function PopupClosePage() {
    return (
        <Suspense fallback={null}>
            <PopupClosePageClient />
        </Suspense>
    )
}

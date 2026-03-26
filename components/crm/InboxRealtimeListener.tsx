'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * Subscribes to Supabase Realtime for new messages.
 * Triggers a router.refresh() to re-fetch server data when a new message arrives.
 */
export function InboxRealtimeListener({ orgId }: { orgId: string }) {
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const channel = supabase
            .channel('inbox-messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `organization_id=eq.${orgId}`,
                },
                () => {
                    router.refresh()
                },
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [orgId, router, supabase])

    return null
}

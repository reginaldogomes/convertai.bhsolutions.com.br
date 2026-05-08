'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'

/**
 * Client-side providers wrapper.
 * Consolidates all client-only context providers in a single boundary
 * to minimize the number of Client Components in the tree.
 *
 * Currently provides:
 * - TanStack Query (QueryClientProvider) with optimized defaults
 * - React Query Devtools (development only)
 */
export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Data stays fresh for 60s — prevents unnecessary refetches
                        staleTime: 60 * 1000,
                        // Keep inactive data in cache for 5 minutes
                        gcTime: 5 * 60 * 1000,
                        // Don't refetch on window focus (aggressive for SaaS dashboard)
                        refetchOnWindowFocus: false,
                        // Retry once on failure, then show error
                        retry: 1,
                    },
                    mutations: {
                        // Retry mutations once on transient errors
                        retry: 1,
                    },
                },
            }),
    )

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        </QueryClientProvider>
    )
}

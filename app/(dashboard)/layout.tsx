import { Sidebar } from '@/components/layout/Sidebar'
import { Toaster } from '@/components/ui/sonner'
import { tryGetAuthContext } from '@/infrastructure/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const ctx = await tryGetAuthContext()

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <Sidebar isSuperAdmin={ctx?.isSuperAdmin ?? false} />
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                {children}
            </main>
            <Toaster theme="dark" position="bottom-right" />
        </div>
    )
}

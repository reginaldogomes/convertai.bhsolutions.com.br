import { Sidebar } from '@/components/layout/Sidebar'
import { Toaster } from '@/components/ui/sonner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                {children}
            </main>
            <Toaster theme="dark" position="bottom-right" />
        </div>
    )
}

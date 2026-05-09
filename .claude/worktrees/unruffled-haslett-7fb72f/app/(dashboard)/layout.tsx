import { Sidebar } from '@/components/layout/Sidebar'
import { Toaster } from '@/components/ui/sonner'
import { tryGetAuthContext } from '@/infrastructure/auth'
import { SupabaseUserRepository } from '@/infrastructure/repositories'

const userRepo = new SupabaseUserRepository()

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const ctx = await tryGetAuthContext()

    let organizations: { orgId: string; orgName: string; role: string }[] = []
    let activeOrgName = ''

    if (ctx) {
        try {
            const memberships = await userRepo.listUserMemberships(ctx.userId)
            organizations = memberships
            const active = memberships.find(m => m.orgId === ctx.orgId)
            activeOrgName = active?.orgName ?? ''
        } catch {
            // non-critical — sidebar still renders without org list
        }
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <Sidebar
                isSuperAdmin={ctx?.isSuperAdmin ?? false}
                organizations={organizations}
                activeOrgId={ctx?.orgId ?? ''}
                activeOrgName={activeOrgName}
            />
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                {children}
            </main>
            <Toaster theme="dark" position="bottom-right" />
        </div>
    )
}

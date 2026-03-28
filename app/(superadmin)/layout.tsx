import { getAuthContext } from '@/infrastructure/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/actions/auth'
import { LayoutDashboard, Building2, Users, Globe, LogOut, ShieldCheck, CreditCard } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Toaster } from '@/components/ui/sonner'
import { BRAND } from '@/lib/brand'

const adminNav = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/organizations', label: 'Organizações', icon: Building2 },
    { href: '/admin/users', label: 'Usuários', icon: Users },
    { href: '/admin/landing-pages', label: 'Landing Pages', icon: Globe },
    { href: '/admin/plans', label: 'Planos', icon: CreditCard },
]

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const ctx = await getAuthContext()
    if (!ctx.isSuperAdmin) redirect('/')

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Admin Sidebar */}
            <aside className="w-55 shrink-0 h-screen bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))] flex flex-col">
                {/* Brand */}
                <div className="px-4 py-4 border-b border-[hsl(var(--sidebar-border))]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-destructive flex items-center justify-center rounded-(--radius) shrink-0 shadow-sm">
                            <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <span className="text-white font-bold text-sm tracking-tight block leading-none">Super Admin</span>
                            <span className="text-white/40 text-[10px]">Platform Console</span>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
                    {adminNav.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="flex items-center gap-3 px-3 py-2 text-xs font-medium transition-all duration-150 rounded-(--radius) text-white/50 hover:text-white/90 hover:bg-white/8 group"
                        >
                            <Icon className="w-4 h-4 shrink-0 text-white/50 group-hover:text-white/80 group-hover:scale-110 transition-transform duration-150" />
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Footer */}
                <div className="px-3 py-3 border-t border-[hsl(var(--sidebar-border))] space-y-0.5">
                    <ThemeToggle />
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-white/50 hover:text-white/90 hover:bg-white/8 rounded-(--radius) transition-all"
                    >
                        <LayoutDashboard className="w-4 h-4 shrink-0" />
                        Voltar ao App
                    </Link>
                    <form action={logout}>
                        <button
                            type="submit"
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-white/50 hover:text-destructive hover:bg-destructive/10 rounded-(--radius) transition-all"
                        >
                            <LogOut className="w-4 h-4 shrink-0" />
                            Sair
                        </button>
                    </form>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                {children}
            </main>
            <Toaster theme="dark" position="bottom-right" />
        </div>
    )
}

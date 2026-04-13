'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/actions/auth'
import {
    LayoutDashboard, Users, TrendingUp, MessageSquare, Mail,
    Zap, Bot, Settings, LogOut, Globe, ShieldCheck, Instagram, Package, FileText, BarChart3, BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'
import { BRAND } from '@/lib/brand'

const navItems = [
    {
        section: 'Visão Geral',
        items: [
            { href: '/', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/analytics', label: 'Analytics', icon: BarChart3 },
            { href: '/release-notes', label: 'Release Notes', icon: FileText },
        ],
    },
    {
        section: 'CRM & Vendas',
        items: [
            { href: '/contacts', label: 'Contatos', icon: Users },
            { href: '/deals', label: 'Pipeline', icon: TrendingUp },
            { href: '/products', label: 'Produtos', icon: Package },
        ],
    },
    {
        section: 'Marketing',
        items: [
            { href: '/landing-pages', label: 'Landing Pages', icon: Globe },
            { href: '/campaigns', label: 'Campanhas', icon: Mail },
        ],
    },
    {
        section: 'Canais',
        items: [
            { href: '/inbox', label: 'WhatsApp', icon: MessageSquare },
            { href: '/instagram', label: 'Instagram', icon: Instagram },
        ],
    },
    {
        section: 'Automação & IA',
        items: [
            { href: '/automations',     label: 'Automações',          icon: Zap },
            { href: '/agents',          label: 'Agentes IA',          icon: Bot },
            { href: '/knowledge-base',  label: 'Base de Conhecimento', icon: BookOpen },
        ],
    },
] as const

export function Sidebar({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
    const pathname = usePathname()

    return (
        <aside className="w-55 shrink-0 h-screen bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))] flex flex-col">
            {/* Brand */}
            <div className="px-4 py-4 border-b border-[hsl(var(--sidebar-border))]">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-primary flex items-center justify-center rounded-(--radius) shrink-0 shadow-sm">
                        <span className="text-white font-black text-xs tracking-tighter">{BRAND.abbr}</span>
                    </div>
                    <span className="text-white font-bold text-sm tracking-tight">{BRAND.name}</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
                {navItems.map(({ section, items }) => (
                    <div key={section} className="pt-2 first:pt-0">
                        <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">
                            {section}
                        </p>
                        <div className="space-y-0.5">
                            {items.map(({ href, label, icon: Icon }) => {
                                const active = pathname === href || (href !== '/' && pathname.startsWith(href))
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2 text-xs font-medium transition-all duration-150 rounded-(--radius) group',
                                            active
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'text-white/50 hover:text-white hover:bg-white/8'
                                        )}
                                    >
                                        <Icon className={cn(
                                            'w-4 h-4 shrink-0 transition-transform duration-150',
                                            active ? 'text-white' : 'text-white/50 group-hover:text-white',
                                            'group-hover:scale-110'
                                        )} />
                                        {label}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer actions */}
            <div className="px-3 py-3 border-t border-[hsl(var(--sidebar-border))] space-y-0.5">
                <ThemeToggle />
                {isSuperAdmin && (
                    <Link
                        href="/admin"
                        className={cn(
                            'flex items-center gap-3 px-3 py-2 text-xs font-medium transition-all duration-150 rounded-(--radius) group',
                            pathname.startsWith('/admin')
                                ? 'bg-destructive text-white shadow-sm'
                                : 'text-white/50 hover:text-white hover:bg-destructive/20'
                        )}
                    >
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        Super Admin
                    </Link>
                )}
                <Link
                    href="/settings"
                    className={cn(
                        'flex items-center gap-3 px-3 py-2 text-xs font-medium transition-all duration-150 rounded-(--radius) group',
                        pathname === '/settings'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-white/50 hover:text-white hover:bg-white/8'
                    )}
                >
                    <Settings className="w-4 h-4 shrink-0 group-hover:rotate-45 transition-transform duration-300" />
                    Configurações
                </Link>
                <form action={logout}>
                    <button
                        type="submit"
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/8 transition-all duration-150 rounded-(--radius) group"
                    >
                        <LogOut className="w-4 h-4 shrink-0" />
                        Sair
                    </button>
                </form>
            </div>
        </aside>
    )
}

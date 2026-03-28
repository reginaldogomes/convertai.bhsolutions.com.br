'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])
    if (!mounted) return <div className="w-8 h-8" />

    const isDark = resolvedTheme === 'dark'
    const next = isDark ? 'light' : 'dark'
    const Icon = isDark ? Moon : Sun
    const label = isDark ? 'Escuro' : 'Claro'

    return (
        <button
            onClick={() => setTheme(next)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors w-full rounded-(--radius)"
            title={`Tema: ${label}`}
        >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{label}</span>
        </button>
    )
}

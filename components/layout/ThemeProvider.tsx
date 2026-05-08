'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
    theme: Theme
    resolvedTheme: 'light' | 'dark'
    setTheme: (theme: Theme) => void
    themes: Theme[]
    systemTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * Custom ThemeProvider that avoids script injection inside React components.
 * This resolves the React 19 / Next.js 15+ "Encountered a script tag" error.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark')
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')

    useEffect(() => {
        // Initial sync from localStorage/document
        const savedTheme = localStorage.getItem('theme') as Theme || 'dark'
        setThemeState(savedTheme)
        
        const updateTheme = (newTheme: Theme) => {
            const root = window.document.documentElement
            let resolved: 'light' | 'dark' = 'dark'
            
            if (newTheme === 'system') {
                resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            } else {
                resolved = newTheme as 'light' | 'dark'
            }
            
            root.classList.remove('light', 'dark')
            root.classList.add(resolved)
            setResolvedTheme(resolved)
        }

        updateTheme(savedTheme)
    }, [])

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme)
        localStorage.setItem('theme', newTheme)
        
        const root = window.document.documentElement
        let resolved: 'light' | 'dark' = 'dark'
        
        if (newTheme === 'system') {
            resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        } else {
            resolved = newTheme as 'light' | 'dark'
        }
        
        root.classList.remove('light', 'dark')
        root.classList.add(resolved)
        setResolvedTheme(resolved)
    }

    return (
        <ThemeContext.Provider value={{ 
            theme, 
            resolvedTheme, 
            setTheme, 
            themes: ['light', 'dark', 'system'],
            systemTheme: 'dark' // Simplified
        }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}

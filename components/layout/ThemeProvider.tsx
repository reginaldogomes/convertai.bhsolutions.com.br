'use client'

import type { ReactNode } from 'react'
import { createContext, useContext, useLayoutEffect, useMemo, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  themes: Theme[]
  systemTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
  themes: ['light', 'dark', 'system'],
  systemTheme: 'light',
})

function getPreferredSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem('theme')
    return value === 'light' || value === 'dark' || value === 'system' ? value : null
  } catch {
    return null
  }
}

function applyTheme(theme: Theme, systemTheme: 'light' | 'dark') {
  const html = document.documentElement
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  if (resolvedTheme === 'dark') {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() =>
    typeof window === 'undefined' ? 'light' : getPreferredSystemTheme(),
  )

  useLayoutEffect(() => {
    const storedTheme = getStoredTheme()
    const preferredTheme = getPreferredSystemTheme()
    const initialTheme = storedTheme ?? 'dark'

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSystemTheme(preferredTheme)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(initialTheme)
    applyTheme(initialTheme, preferredTheme)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      const nextSystemTheme = event.matches ? 'dark' : 'light'
      setSystemTheme(nextSystemTheme)
      if (theme === 'system') {
        applyTheme('system', nextSystemTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  useLayoutEffect(() => {
    applyTheme(theme, systemTheme)
  }, [theme, systemTheme])

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme)
    try {
      localStorage.setItem('theme', nextTheme)
    } catch {
      // ignore
    }
  }

  const resolvedTheme = theme === 'system' ? systemTheme : theme

  const contextValue = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      themes: ['light', 'dark', 'system'] as Theme[],
      systemTheme,
    }),
    [theme, resolvedTheme, systemTheme],
  )

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}

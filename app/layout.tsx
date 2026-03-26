import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { BRAND } from '@/lib/brand'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: BRAND.title,
  description: 'Plataforma unificada de CRM, automação e comunicação com agentes de IA para PMEs.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

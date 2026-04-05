import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { BRAND } from '@/lib/brand'
import { getSiteUrl } from '@/lib/site-url'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: BRAND.title,
  description: 'Plataforma unificada de CRM, automação e comunicação com agentes de IA para PMEs.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: BRAND.title,
    description: 'Plataforma unificada de CRM, automação e comunicação com agentes de IA para PMEs.',
    siteName: BRAND.fullName,
  },
  twitter: {
    card: 'summary_large_image',
    title: BRAND.title,
    description: 'Plataforma unificada de CRM, automação e comunicação com agentes de IA para PMEs.',
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
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

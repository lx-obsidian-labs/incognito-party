import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { ToastProvider } from '@/components/shared/Toast'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import InitSession from './init-session'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Incognito Party',
  description: 'Speak freely. Be heard. Get tipped.',
  manifest: '/manifest.json',

  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Incognito' },
}

export const viewport: Viewport = {
  themeColor: '#0f0f23',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-inc-dark text-inc-text antialiased`}>
        <ToastProvider />
        <main className="mx-auto max-w-lg min-h-screen pb-20">
          <InitSession />
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
        <Navbar />
      </body>
    </html>
  )
}

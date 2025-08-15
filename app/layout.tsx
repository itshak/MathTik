import type { Metadata } from 'next'
import './globals.css'
import { FabMenu } from '@/components/nav/FabMenu'
import { ThemeEffect } from '@/components/nav/ThemeEffect'

export const metadata: Metadata = {
  title: 'MathTik',
  description: 'MathTik — Multiply & Divide with fun mini-games',
}
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeEffect />
        <div className="min-h-screen bg-[var(--bg)]">
          {children}
        </div>
        <FabMenu />
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'
import { ThemeEffect } from '@/components/nav/ThemeEffect'

export const metadata: Metadata = {
  title: 'MathTik',
  description: 'MathTik — Multiply & Divide with fun mini-games',
}
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, minimumScale: 1, userScalable: false }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeEffect />
        <div className="min-h-screen bg-[var(--bg)]">
          {children}
        </div>
      </body>
    </html>
  )
}

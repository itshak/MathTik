import type { Metadata } from 'next'
import './globals.css'
import { BottomNav } from '@/components/nav/BottomNav'

export const metadata: Metadata = {
  title: 'MathTik',
  description: 'MathTik — Multiply & Divide with fun mini-games',
}
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="min-h-screen pb-20 bg-[var(--bg)]">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  )
}

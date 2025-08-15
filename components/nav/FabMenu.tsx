"use client"
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useGameStore } from '@/lib/store'

export function FabMenu() {
  const pathname = usePathname()
  const hideOn = ['/menu', '/settings']
  const hidden = hideOn.includes(pathname)
  const theme = useGameStore(s => s.profile.theme)

  // Apply theme to document root via data-attribute for CSS hooks
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme || 'default')
    }
  }, [theme])

  if (hidden) return null
  const MENU_HREF = '/menu' as Route
  return (
    <div className="fixed bottom-5 right-5 z-50">
      <Link href={MENU_HREF} className="rounded-full w-14 h-14 grid place-items-center bg-brand text-white shadow-soft active:scale-95 select-none text-2xl">
        ☰
      </Link>
    </div>
  )
}

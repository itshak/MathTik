"use client"
import { useEffect } from 'react'
import { useGameStore } from '@/lib/store'

export function ThemeEffect() {
  const theme = useGameStore(s => s.profile.theme)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme || 'default')
    }
  }, [theme])
  return null
}

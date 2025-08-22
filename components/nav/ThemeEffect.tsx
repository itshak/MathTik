"use client"
import { useEffect } from 'react'
import { useGameStore } from '@/lib/store'

export function ThemeEffect() {
  const theme = useGameStore(s => s.profile.theme)
  const lang = useGameStore(s => s.profile.language || 'en')
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme || 'buzz')
    }
  }, [theme])
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang)
      const dir = lang === 'he' ? 'rtl' : 'ltr'
      document.documentElement.setAttribute('dir', dir)
    }
  }, [lang])
  return null
}

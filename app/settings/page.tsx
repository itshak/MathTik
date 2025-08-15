"use client"
import Link from 'next/link'
import type { Route } from 'next'
import { useGameStore } from '@/lib/store'

const LANGS: { code: 'en'|'ru'|'he'; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'he', label: 'עברית', flag: '🇮🇱' },
]
const THEMES: { id: 'default'|'barbie'; label: string; swatch: string }[] = [
  { id: 'default', label: 'Default', swatch: '#6c5ce7' },
  { id: 'barbie', label: 'Barbie', swatch: '#ec4899' },
]

export default function SettingsPage() {
  const lang = useGameStore(s => s.profile.language || 'en')
  const theme = useGameStore(s => s.profile.theme || 'default')
  const setLanguage = useGameStore(s => s.setLanguage)
  const setTheme = useGameStore(s => s.setTheme)

  return (
    <main className="container py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Settings</h1>
        <Link href={'/menu' as Route} className="btn btn-ghost">⬅ Menu</Link>
      </header>

      <section className="card p-4 mt-6">
        <h2 className="font-bold mb-2">Language</h2>
        <div className="grid grid-cols-3 gap-2">
          {LANGS.map(l => (
            <button key={l.code} onClick={() => setLanguage(l.code)} className={`btn ${lang===l.code?'bg-brand text-white':'btn-ghost'}`}>
              <span className="mr-1">{l.flag}</span> {l.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-4 mt-6">
        <h2 className="font-bold mb-2">Theme</h2>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map(t => (
            <button key={t.id} onClick={() => setTheme(t.id)} className={`btn ${theme===t.id?'bg-brand text-white':'btn-ghost'}`}>
              <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: t.swatch }} /> {t.label}
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

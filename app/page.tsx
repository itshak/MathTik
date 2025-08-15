"use client"
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

export default function HomePage() {
  const t = useI18n()
  return (
    <main className="game-screen flex items-center justify-center px-4">
      <section className="card p-8 text-center max-w-xl w-full">
        <div className="text-7xl sm:text-8xl">🧮</div>
        <h1 className="text-4xl sm:text-5xl font-extrabold mt-3">{t('appTitle')}</h1>
        <p className="text-gray-500 mt-2 text-lg sm:text-xl">{t('subtitle')}</p>
        <div className="mt-6">
          <Link href="/play" className="btn btn-primary text-lg px-6 py-4">{t('startPlaying')}</Link>
        </div>
      </section>
    </main>
  )
}

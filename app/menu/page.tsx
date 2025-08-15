"use client"
import Link from 'next/link'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useGameStore } from '@/lib/store'
import { useI18n } from '@/lib/i18n'

export default function MenuPage() {
  const s = useGameStore()
  const r = useRouter()
  const [now, setNow] = useState(Date.now())
  const t = useI18n()

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const session = useMemo(() => {
    if (s.sessionStartAt) {
      return {
        durationMs: now - s.sessionStartAt,
        attempts: s.sessionAttempts,
        correct: s.sessionCorrect,
      }
    }
    return s.lastSession
  }, [s.sessionStartAt, s.sessionAttempts, s.sessionCorrect, s.lastSession, now])

  function exitSession() {
    s.endSession()
    r.push('/')
  }

  return (
    <main className="container py-8">
      <h1 className="text-3xl font-extrabold">{t('appTitle')}</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link href={'/play' as Route} className="btn bg-brand text-white text-lg">▶ {t('continue')}</Link>
        <Link href={'/settings' as Route} className="btn btn-ghost text-lg">⚙ {t('settings')}</Link>
        <Link href={'/rewards' as Route} className="btn btn-ghost text-lg">🏆 {t('rewards')}</Link>
      </div>

      <div className="mt-6 card p-4">
        <h2 className="font-bold mb-2">{t('session')}</h2>
        {session ? (
          <div className="text-sm text-gray-600 flex gap-4 flex-wrap">
            <span>⏱ {(session.durationMs/1000|0)}s</span>
            <span>✅ {session.correct}/{session.attempts}</span>
            <span>⭐ {s.profile.points}</span>
          </div>
        ) : (
          <div className="text-sm text-gray-500">{t('noSessionYet')}</div>
        )}
      </div>

      <div className="mt-6">
        <button onClick={exitSession} className="btn btn-ghost">🏠 {t('exit')}</button>
      </div>
    </main>
  )
}

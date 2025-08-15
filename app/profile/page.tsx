"use client"
import { useMemo } from 'react'
import { useGameStore } from '@/lib/store'

export default function ProfilePage() {
  const s = useGameStore()
  const masteryStats = useMemo(() => {
    const all = Object.values(s.mastery)
    const due = all.filter(m => m.dueAt <= Math.floor(Date.now()/1000)).length
    const strong = all.filter(m => m.score >= 4).length
    const weak = all.filter(m => m.score <= 1).length
    return { total: all.length, due, strong, weak }
  }, [s.mastery])

  return (
    <main className="container pt-6 pb-24">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Profile</h1>
        <div className="text-sm bg-white px-3 py-1 rounded-xl border">Lvl {s.profile.level}</div>
      </header>

      <section className="card p-4 mt-3">
        <div className="flex items-center gap-4">
          <div className="text-5xl">🙂</div>
          <div>
            <div className="font-extrabold">Math Explorer</div>
            <div className="text-xs text-gray-500">Facts up to ×{s.profile.maxFactor}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="bg-white border rounded-xl p-3">
            <div className="text-xs text-gray-500">Points</div>
            <div className="text-xl font-extrabold">{s.profile.points}</div>
          </div>
          <div className="bg-white border rounded-xl p-3">
            <div className="text-xs text-gray-500">Streak</div>
            <div className="text-xl font-extrabold">{s.profile.streak}</div>
          </div>
          <div className="bg-white border rounded-xl p-3">
            <div className="text-xs text-gray-500">Best</div>
            <div className="text-xl font-extrabold">{s.profile.bestStreak}</div>
          </div>
        </div>
      </section>

      <section className="card p-4 mt-3">
        <div className="font-bold">Mastery</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-center">
          <div className="bg-white border rounded-xl p-3">
            <div className="text-xs text-gray-500">Tracked</div>
            <div className="text-lg font-extrabold">{masteryStats.total}</div>
          </div>
          <div className="bg-white border rounded-xl p-3">
            <div className="text-xs text-gray-500">Due</div>
            <div className="text-lg font-extrabold">{masteryStats.due}</div>
          </div>
          <div className="bg-white border rounded-xl p-3">
            <div className="text-xs text-gray-500">Strong</div>
            <div className="text-lg font-extrabold text-good">{masteryStats.strong}</div>
          </div>
          <div className="bg-white border rounded-xl p-3">
            <div className="text-xs text-gray-500">Weak</div>
            <div className="text-lg font-extrabold text-bad">{masteryStats.weak}</div>
          </div>
        </div>
      </section>
    </main>
  )
}

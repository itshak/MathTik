"use client"
import { useGameStore, REWARDS } from '@/lib/store'

export default function RewardsPage() {
  const s = useGameStore()
  const unlockedCount = REWARDS.filter(r => s.profile.unlocked[r.id]).length

  return (
    <main className="container pt-6 pb-24">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Rewards</h1>
        <div className="text-sm bg-white px-3 py-1 rounded-xl border">⭐ {s.profile.points}</div>
      </header>

      <section className="mt-3 text-sm text-gray-500">Unlocked {unlockedCount}/{REWARDS.length}</section>

      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
        {REWARDS.map(r => {
          const unlocked = !!s.profile.unlocked[r.id]
          return (
            <div key={r.id} className={`card p-4 text-center border ${unlocked ? 'border-brand' : 'border-gray-200 opacity-70'}`}>
              <div className="text-4xl">{r.emoji}</div>
              <div className="font-bold mt-2">{r.label}</div>
              <div className="text-xs text-gray-500 mt-1">Cost: {r.cost}</div>
              <div className="mt-2">
                <button disabled={!unlocked} className={`btn w-full ${unlocked ? 'btn-primary' : 'btn-ghost'}`}>{unlocked ? 'Use' : 'Locked'}</button>
              </div>
            </div>
          )
        })}
      </section>
    </main>
  )
}

"use client"
import { useEffect, useMemo } from 'react'
import { useGameStore } from '@/lib/store'
import { AnswerTiles } from '@/components/game/AnswerTiles'
import { NumberWheel } from '@/components/game/NumberWheel'
import { MultiplyGroups } from '@/components/game/MultiplyGroups'
import { DivisionDealer } from '@/components/game/DivisionDealer'
import { ArrayBuilder } from '@/components/game/ArrayBuilder'
import { audio } from '@/lib/audio'

export default function PlayPage() {
  const s = useGameStore()
  const ch = s.current

  useEffect(() => { if (!ch) s.nextChallenge() }, [ch, s])
  useEffect(() => { audio.setEnabled(s.profile.soundOn) }, [s.profile.soundOn])

  const Game = useMemo(() => {
    if (!ch) return null
    if (ch.game === 'multiply-groups') return (
      <MultiplyGroups key={ch.id} a={ch.a} b={ch.b} />
    )
    if (ch.game === 'division-dealer') return (
      <DivisionDealer key={ch.id} a={ch.a} b={ch.b} />
    )
    if (ch.game === 'array-builder') return (
      <ArrayBuilder key={ch.id} a={ch.a} b={ch.b} />
    )
    return null
  }, [ch])

  if (!ch) return null

  function onAnswer(val: number) {
    if (!ch) return
    const correct = val === ch.answer
    if (correct) audio.success(); else audio.error()
    s.answer(val)
  }

  return (
    <main className="container pt-6 pb-24">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-white px-2 py-1 rounded-lg border">Lvl {s.profile.level}</span>
          <span className="text-xs bg-white px-2 py-1 rounded-lg border">⭐ {s.profile.points}</span>
          <button onClick={() => s.toggleSound()} className={`text-xs px-2 py-1 rounded-lg border ${s.profile.soundOn ? 'bg-green-50' : 'bg-red-50'}`}>{s.profile.soundOn ? '🔊' : '🔇'}</button>
        </div>
      </header>

      <section className="mt-4 text-center">
        <div className="text-5xl sm:text-6xl font-extrabold">{ch.a} {ch.op === 'mul' ? '×' : '÷'} {ch.b}</div>
      </section>

      <section className="card p-4 mt-4">
        {Game}
      </section>

      <section className="mt-3">
        {ch.input === 'mc' ? (
          <AnswerTiles values={ch.choices} correct={ch.answer} onSelect={onAnswer} />
        ) : (
          <NumberWheel min={0} max={100} onPick={onAnswer} />
        )}
      </section>
    </main>
  )
}

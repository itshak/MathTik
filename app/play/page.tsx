"use client"
import { useEffect, useMemo, useState } from 'react'
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
  // Start session when entering play
  useEffect(() => {
    if (!s.sessionStartAt) s.startSession()
  }, [s.sessionStartAt, s.startSession])
  useEffect(() => { audio.setEnabled(s.profile.soundOn) }, [s.profile.soundOn])

  const [lastMistake, setLastMistake] = useState(false)

  const Game = useMemo(() => {
    if (!ch) return null
    if (ch.game === 'multiply-groups') return (
      <MultiplyGroups key={ch.id} a={ch.a} b={ch.b} mistake={lastMistake} />
    )
    if (ch.game === 'division-dealer') return (
      <DivisionDealer key={ch.id} a={ch.a} b={ch.b} mistake={lastMistake} />
    )
    if (ch.game === 'array-builder') return (
      <ArrayBuilder key={ch.id} a={ch.a} b={ch.b} mistake={lastMistake} />
    )
    return null
  }, [ch, lastMistake])

  if (!ch) return null

  function onAnswer(val: number) {
    if (!ch) return
    const correct = val === ch.answer
    if (correct) audio.success(); else audio.error()
    setLastMistake(!correct)
    if (!correct) {
      // briefly mark mistake for the next game to react
      setTimeout(() => setLastMistake(false), 1200)
    }
    s.answer(val)
  }

  const targetPerLevel = 10
  const progressPct = Math.min(100, Math.round(((s.sessionCorrect % targetPerLevel) / targetPerLevel) * 100))

  return (
    <main className="game-screen flex flex-col">
      <div className="px-4 pt-4">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-white px-2 py-1 rounded-lg border">Lvl {s.profile.level}</span>
            <span className="text-xs bg-white px-2 py-1 rounded-lg border">⭐ {s.profile.points}</span>
            <button onClick={() => s.toggleSound()} className={`text-xs px-2 py-1 rounded-lg border ${s.profile.soundOn ? 'bg-green-50' : 'bg-red-50'}`}>{s.profile.soundOn ? '🔊' : '🔇'}</button>
          </div>
          <div className="text-sm font-extrabold">{ch.a} {ch.op === 'mul' ? '×' : '÷'} {ch.b}</div>
        </header>
        <div className="progress mt-2">
          <div className="bar bg-brand" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <section className="flex-1 overflow-hidden px-4 py-2">
        <div className="card h-full p-4 game-area overflow-auto">
          {Game}
        </div>
      </section>

      <section className="px-4 pb-5">
        {ch.input === 'mc' ? (
          <AnswerTiles values={ch.choices} correct={ch.answer} onSelect={onAnswer} />
        ) : (
          <NumberWheel min={0} max={100} onPick={onAnswer} />
        )}
      </section>
    </main>
  )
}

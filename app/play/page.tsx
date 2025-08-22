"use client"
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useGameStore } from '@/lib/store'
import { AnswerTiles } from '@/components/game/AnswerTiles'
import { NumberWheel } from '@/components/game/NumberWheel'
import { MultiplyGroups } from '@/components/game/MultiplyGroups'
import { DivisionDealer } from '@/components/game/DivisionDealer'
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
  const [mistakeCount, setMistakeCount] = useState(0)
  const [awaitingAutoSolve, setAwaitingAutoSolve] = useState(false)

  const Game = useMemo(() => {
    if (!ch) return null
    if (ch.game === 'multiply-groups') return (
      <MultiplyGroups key={ch.id} a={ch.a} b={ch.b} mistake={lastMistake} mistakes={mistakeCount} onReady={onGameReady} />
    )
    if (ch.game === 'division-dealer') return (
      <DivisionDealer key={ch.id} a={ch.a} b={ch.b} mistake={lastMistake} onReady={onGameReady} mistakes={mistakeCount} />
    )
    // ArrayBuilder is disabled for now
    return null
  }, [ch, lastMistake, mistakeCount])

  if (!ch) return null

  useEffect(() => { setMistakeCount(0); setLastMistake(false) }, [ch?.id])

  function onAnswer(val: number) {
    if (!ch) return
    const correct = val === ch.answer
    if (correct) audio.success(); else audio.error()
    if (!correct) {
      // trigger auto-solve sequence in game and delay next challenge until onReady
      setLastMistake(true)
      setMistakeCount(c => c + 1)
      setAwaitingAutoSolve(true)
      return
    }
    // correct: proceed immediately
    setLastMistake(false)
    s.answer(val)
  }

  function onGameReady() {
    // Called by game when its auto-solve animation is complete (after a wrong attempt)
    // Do NOT advance to the next challenge on wrong answers; allow the player to try again with clues.
    setAwaitingAutoSolve(false)
    setLastMistake(false)
  }

  const targetPerLevel = 10
  const progressPct = Math.min(100, Math.round(((s.sessionCorrect % targetPerLevel) / targetPerLevel) * 100))

  return (
    <main className="game-screen flex flex-col">
      <div className="px-4 pt-4">
        <header className="flex items-center justify-between">
          {/* Top-left: Menu icon */}
          <Link href="/menu" className="text-xl px-3 py-1 rounded-lg border bg-white shadow-soft active:scale-95 select-none">☰</Link>
          {/* Top-right: Level + stats */}
          <div className="flex items-center gap-2">
            <div className="text-xs bg-white px-2 py-1 rounded-lg border flex items-center gap-1">🏅 <span className="font-bold">{s.profile.level}</span></div>
            <span className="text-xs bg-white px-2 py-1 rounded-lg border">⭐ {s.profile.points}</span>
            <button onClick={() => s.toggleSound()} className={`text-xs px-2 py-1 rounded-lg border ${s.profile.soundOn ? 'bg-green-50' : 'bg-red-50'}`}>{s.profile.soundOn ? '🔊' : '🔇'}</button>
          </div>
        </header>
        <div className="progress mt-2">
          <div className="bar bg-brand" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <section className="flex-1 overflow-hidden px-4 py-1">
        <div className="card h-full p-3 game-area overflow-hidden flex flex-col items-center">
          <div className="text-center mb-4 mt-2">
            <div className="text-4xl sm:text-5xl font-black tracking-tight">{ch.a} {ch.op === 'mul' ? '×' : '÷'} {ch.b}</div>
          </div>
          <div className="w-full max-w-4xl mx-auto">
            {Game}
          </div>
        </div>
      </section>

      <section className="px-4 pb-5">
        {ch.input === 'mc' ? (
          <AnswerTiles values={ch.choices} correct={ch.answer} onSelect={onAnswer} highlightCorrect={mistakeCount >= 3} />
        ) : (
          <NumberWheel min={0} max={100} onPick={onAnswer} correct={ch.answer} highlightCorrect={mistakeCount >= 3} />
        )}
      </section>
    </main>
  )
}

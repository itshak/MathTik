"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useGameStore } from '@/lib/store'
import { AnswerTiles } from '@/components/game/AnswerTiles'
import { NumberWheel } from '@/components/game/NumberWheel'
import { MultiplyGroups } from '@/components/game/MultiplyGroups'
import { DivisionDealer } from '@/components/game/DivisionDealer'
import { CoinsMultiplyGroups } from '@/components/game/CoinsMultiplyGroups'
import { CoinsDivisionDealer } from '@/components/game/CoinsDivisionDealer'
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
  // Measure available height for game content so it never goes under the bottom answers row
  const cardRef = useRef<HTMLDivElement | null>(null)
  const eqRef = useRef<HTMLDivElement | null>(null)
  const [maxGameH, setMaxGameH] = useState(0)

  const Game = useMemo(() => {
    if (!ch) return null
    if (ch.game === 'multiply-groups') return (
      <MultiplyGroups key={ch.id} a={ch.a} b={ch.b} mistake={lastMistake} mistakes={mistakeCount} onReady={onGameReady} maxH={maxGameH} />
    )
    if (ch.game === 'division-dealer') return (
      <DivisionDealer key={ch.id} a={ch.a} b={ch.b} mistake={lastMistake} onReady={onGameReady} mistakes={mistakeCount} maxH={maxGameH} />
    )
    if (ch.game === 'coins-multiply-groups') return (
      <CoinsMultiplyGroups key={ch.id} a={ch.a} b={ch.b} mistake={lastMistake} mistakes={mistakeCount} onReady={onGameReady} maxH={maxGameH} />
    )
    if (ch.game === 'coins-division-dealer') return (
      <CoinsDivisionDealer key={ch.id} a={ch.a} b={ch.b} mistake={lastMistake} onReady={onGameReady} mistakes={mistakeCount} maxH={maxGameH} />
    )
    // ArrayBuilder is disabled for now
    return null
  }, [ch, lastMistake, mistakeCount, maxGameH])

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

  // Observe the card height and equation height to compute the space available for the game content
  useEffect(() => {
    if (!cardRef.current) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const cardH = e.contentRect.height
        const eqH = eqRef.current ? eqRef.current.offsetHeight : 0
        // Subtract equation height and small spacing (mb-4 + mt-2 ~ 24px) and padding for safety
        const available = Math.max(0, Math.floor(cardH - eqH - 28))
        setMaxGameH(available)
      }
    })
    ro.observe(cardRef.current)
    return () => ro.disconnect()
  }, [])

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
        <div ref={cardRef} className="card h-full p-3 game-area overflow-hidden flex flex-col items-center">
          <div ref={eqRef} className="text-center mb-4 mt-2">
            {/* Keep numeric equation left-to-right in all languages */}
            <div dir="ltr" className="text-4xl sm:text-5xl font-black tracking-tight">{ch.a} {ch.op === 'mul' ? '×' : '÷'} {ch.b}</div>
          </div>
          <div className="w-full">
            {Game}
          </div>
        </div>
      </section>

      <section className="px-4 pb-5">
        {ch.input === 'mc' ? (
          <AnswerTiles values={ch.choices} correct={ch.answer} onSelect={onAnswer} disabled={awaitingAutoSolve} highlightCorrect={mistakeCount >= 3} />
        ) : (
          <NumberWheel min={0} max={100} onPick={onAnswer} disabled={awaitingAutoSolve} correct={ch.answer} highlightCorrect={mistakeCount >= 3} />
        )}
      </section>
    </main>
  )
}

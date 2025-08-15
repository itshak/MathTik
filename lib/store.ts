"use client"
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Attempt, Challenge, GameState, Mastery, Op } from './types'
import { choice, clamp, keyFor, nowSec, rand, shuffle } from './utils'

// Rewards catalog (ids used for future profile sync)
export const REWARDS = [
  { id: 'star', label: 'Shiny Star', emoji: '🌟', cost: 50 },
  { id: 'rocket', label: 'Rocket', emoji: '🚀', cost: 120 },
  { id: 'rainbow', label: 'Rainbow', emoji: '🌈', cost: 250 },
  { id: 'unicorn', label: 'Unicorn', emoji: '🦄', cost: 400 },
]

const DEFAULT: GameState = {
  profile: {
    points: 0,
    streak: 0,
    bestStreak: 0,
    level: 1,
    maxFactor: 2,
    totalCorrect: 0,
    totalAttempts: 0,
    soundOn: true,
    unlocked: {},
    language: 'en',
    theme: 'default',
  },
  mastery: {},
  recentMistakes: [],
  lastOp: undefined,
  sessionStartAt: undefined,
  sessionAttempts: 0,
  sessionCorrect: 0,
}

type Store = GameState & {
  current?: Challenge
  startedAt?: number
  // actions
  nextChallenge: () => void
  answer: (value: number) => void
  toggleSound: () => void
  startSession: () => void
  endSession: () => void
  setLanguage: (lang: 'en' | 'ru' | 'he') => void
  setTheme: (theme: 'default' | 'barbie') => void
}

// Simple SRS intervals (seconds)
const START_INTERVALS = [10, 60, 300, 1800, 86400, 259200]

function makeChoices(correct: number): number[] {
  const set = new Set<number>([correct])
  while (set.size < 4) {
    const delta = rand(9) - 4
    const val = Math.max(0, correct + delta + (delta === 0 ? rand(3)+1 : 0))
    set.add(val)
  }
  return shuffle([...set])
}

function makeMul(max: number) {
  const a = rand(max) + 1
  const b = rand(max) + 1
  const answer = a * b
  return { op: 'mul' as Op, a, b, answer }
}
function makeDiv(max: number) {
  const b = rand(max) + 1
  const q = rand(max) + 1
  const a = b * q
  return { op: 'div' as Op, a, b, answer: q }
}

function pickGame(op: Op): Challenge['game'] {
  return op === 'mul' ? (Math.random() < 0.5 ? 'multiply-groups' : 'array-builder') : 'division-dealer'
}

function buildChallenge(max: number, lastOp?: Op, review?: {op: Op, a: number, b: number}): Challenge {
  // compute a seed problem with answer included
  const seed = review
    ? { op: review.op, a: review.a, b: review.b, answer: review.op === 'mul' ? review.a * review.b : Math.floor(review.a / review.b) }
    : (Math.random() < 0.5 ? makeMul(max) : makeDiv(max))
  // avoid repeating same op repeatedly when not reviewing
  const use = (!review && lastOp && Math.random() < 0.5) ? (lastOp === 'mul' ? makeDiv(max) : makeMul(max)) : seed
  const id = `${use.op}:${use.a}:${use.b}:${Date.now()}`
  const input = Math.random() < 0.75 ? 'mc' : 'wheel'
  return {
    id,
    op: use.op,
    a: use.a,
    b: use.b,
    answer: use.answer,
    choices: makeChoices(use.answer),
    game: pickGame(use.op),
    input,
  }
}

function updateMastery(m: Mastery | undefined, correct: boolean): Mastery {
  const now = nowSec()
  if (!m) {
    const ease = correct ? 2.0 : 1.6
    const intervalSec = correct ? START_INTERVALS[0] : 10
    return { key: '', score: correct ? 1 : 0, ease, intervalSec, dueAt: now + intervalSec, lastResult: correct }
  }
  let score = clamp(m.score + (correct ? 1 : -2), 0, 5)
  let ease = clamp(m.ease + (correct ? 0.08 : -0.2), 1.2, 2.6)
  let intervalSec = correct ? Math.max(START_INTERVALS[0], Math.round(m.intervalSec * ease)) : 10
  return { ...m, score, ease, intervalSec, dueAt: now + intervalSec, lastResult: correct }
}

export const useGameStore = create<Store>()(persist((set, get) => ({
  ...DEFAULT,
  startSession: () => set(s => s.sessionStartAt ? s : ({ sessionStartAt: Date.now(), sessionAttempts: 0, sessionCorrect: 0 })),
  endSession: () => set(s => {
    if (!s.sessionStartAt) return s
    const durationMs = Date.now() - s.sessionStartAt
    return { lastSession: { durationMs, attempts: s.sessionAttempts, correct: s.sessionCorrect }, sessionStartAt: undefined }
  }),
  setLanguage: (lang) => set(s => ({ profile: { ...s.profile, language: lang } })),
  setTheme: (theme) => set(s => ({ profile: { ...s.profile, theme } })),
  nextChallenge: () => {
    const s = get()
    const max = clamp(s.profile.maxFactor, 2, 10)
    // SRS first: find any due mastery or recent mistake
    let review: {op: Op, a: number, b: number} | undefined
    if (s.recentMistakes.length) {
      const mk = s.recentMistakes.shift()!
      const [kind, pair] = mk.split(':')
      const [a,b] = pair.includes('x') ? pair.split('x').map(Number) : pair.split('/').map(Number)
      const op = kind === 'm' ? 'mul' : 'div'
      review = { op: op as Op, a, b }
    } else {
      const due = Object.values(s.mastery).find(m => m.dueAt <= nowSec())
      if (due) {
        const [kind, pair] = due.key.split(':')
        const [a,b] = pair.includes('x') ? pair.split('x').map(Number) : pair.split('/').map(Number)
        const op = kind === 'm' ? 'mul' : 'div'
        review = { op: op as Op, a, b }
      }
    }
    const ch = buildChallenge(max, s.lastOp, review)
    set({ current: ch, startedAt: Date.now(), lastOp: ch.op })
  },
  answer: (value: number) => {
    const s = get()
    const ch = s.current; if (!ch) return
    const correct = value === ch.answer
    const timeMs = Date.now() - (s.startedAt ?? Date.now())

    const key = keyFor(ch.op, ch.a, ch.b)
    const prev = s.mastery[key]
    const updated = updateMastery(prev && { ...prev, key }, correct)
    updated.key = key

    const pointsBase = 10
    const streakBonus = Math.min(10, Math.max(0, (s.profile.streak) * 2))

    const profile = { ...s.profile }
    profile.totalAttempts += 1
    if (correct) {
      profile.totalCorrect += 1
      profile.streak += 1
      profile.bestStreak = Math.max(profile.bestStreak, profile.streak)
      profile.points += pointsBase + streakBonus
      // level up periodically
      if (profile.streak % 4 === 0) {
        profile.maxFactor = clamp(profile.maxFactor + 1, 2, 10)
        profile.level = Math.max(profile.level, profile.maxFactor)
      }
      // unlock rewards
      for (const r of REWARDS) {
        if (profile.points >= r.cost) profile.unlocked[r.id] = true
      }
    } else {
      profile.streak = 0
      profile.maxFactor = clamp(profile.maxFactor - 1, 2, 10)
      profile.level = Math.max(1, profile.maxFactor)
      const mkey = ch.op === 'mul' ? `m:${ch.a}x${ch.b}` : `d:${ch.a}/${ch.b}`
      const q = s.recentMistakes.slice()
      if (!q.includes(mkey)) q.push(mkey)
      set({ recentMistakes: q })
    }

    const mastery = { ...s.mastery, [updated.key]: updated }

    set({ profile, mastery, sessionAttempts: (s.sessionAttempts ?? 0) + 1, sessionCorrect: (s.sessionCorrect ?? 0) + (correct ? 1 : 0) })

    // immediately schedule next
    get().nextChallenge()
  },
  toggleSound: () => set(s => ({ profile: { ...s.profile, soundOn: !s.profile.soundOn } })),
}), { name: 'mg2_state' }))

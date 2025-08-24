"use client"
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Attempt, Challenge, GameState, Mastery, Op } from './types'
import { choice, clamp, keyFor, nowSec, rand, shuffle } from './utils'
import { pickFromLevel } from './levels'

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
    levelXP: 0,
    totalCorrect: 0,
    totalAttempts: 0,
    soundOn: true,
    unlocked: {},
    language: 'en',
    theme: 'buzz',
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
  levelUpPending?: number // shows overlay when set to the reached level
  badgeFlash?: boolean
  reviewMode?: boolean
  championPending?: boolean
  // actions
  nextChallenge: () => void
  answer: (value: number) => void
  toggleSound: () => void
  startSession: () => void
  endSession: () => void
  setLanguage: (lang: 'en' | 'ru' | 'he') => void
  setTheme: (theme: 'buzz' | 'barbie') => void
  dismissLevelUp: () => void
  flashBadge: () => void
  dismissChampion: () => void
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

// Level-based selection ratios for prior review (approximation of the plan)
const PRIOR_RATIOS: Record<number, number> = {
  1: 0,
  2: 0.2,
  3: 0.1,
  4: 0.2,
  5: 0.2,
  6: 0.2,
  7: 0.25,
  8: 0.3,
  9: 0.3,
  10: 0.4,
}

function pickGame(op: Op, a: number, b: number): Challenge['game'] {
  // Rule: use coins when multiplication product > 10; for division, when dividend (a) > 10. Otherwise apples.
  if (op === 'mul') {
    return (a * b > 10) ? 'coins-multiply-groups' : 'multiply-groups'
  }
  // op === 'div'
  return (a > 10) ? 'coins-division-dealer' : 'division-dealer'
}

function buildChallenge(level: number): Challenge {
  const ratio = PRIOR_RATIOS[level] ?? 0.2
  const f = pickFromLevel(level, ratio)
  const id = `${f.id}:${Date.now()}`
  const input = Math.random() < 0.75 ? 'mc' : 'wheel'
  return {
    id,
    op: f.op,
    a: f.a,
    b: f.b,
    answer: f.answer,
    choices: makeChoices(f.answer),
    game: pickGame(f.op, f.a, f.b),
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
    const ch = buildChallenge(s.profile.level)
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
      // Level progress: 10 correct answers to complete a level
      const target = 10
      profile.levelXP = (profile.levelXP ?? 0) + 1
      if (profile.levelXP >= target) {
        if (profile.level >= 10) {
          // Enter review mode at cap and show champion overlay
          profile.level = 10
          profile.maxFactor = 10
          profile.levelXP = 0
          set({ reviewMode: true, championPending: true, badgeFlash: true })
          setTimeout(() => set({ badgeFlash: false }), 1400)
        } else {
          const nextLevel = clamp(profile.level + 1, 1, 10)
          profile.level = nextLevel
          profile.maxFactor = nextLevel
          profile.levelXP = 0
          // trigger overlay and badge flash
          set({ levelUpPending: nextLevel, badgeFlash: true })
          // auto-clear the badge flash after a short delay
          setTimeout(() => set({ badgeFlash: false }), 1400)
        }
      }
      // unlock rewards
      for (const r of REWARDS) {
        if (profile.points >= r.cost) profile.unlocked[r.id] = true
      }
    } else {
      profile.streak = 0
      // no level down; gentle progression
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
  dismissLevelUp: () => set({ levelUpPending: undefined }),
  dismissChampion: () => set({ championPending: undefined }),
  flashBadge: () => {
    set({ badgeFlash: true })
    setTimeout(() => set({ badgeFlash: false }), 1200)
  },
}), { name: 'mg2_state' }))

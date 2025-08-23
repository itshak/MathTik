export type Op = 'mul' | 'div'

export type Challenge = {
  id: string
  op: Op
  a: number
  b: number
  answer: number
  choices: number[]
  game: 'multiply-groups' | 'division-dealer' | 'array-builder' | 'coins-multiply-groups' | 'coins-division-dealer'
  input: 'mc' | 'wheel'
}

export type Attempt = {
  at: number
  challengeId: string
  op: Op
  a: number
  b: number
  answer: number
  correct: boolean
  timeMs: number
  game: Challenge['game']
}

export type Mastery = {
  key: string // e.g., m:3x5 or d:12/3
  score: number // 0..5
  ease: number // 1.2..2.5
  intervalSec: number
  dueAt: number // epoch seconds
  lastResult?: boolean
}

export type ProfileState = {
  points: number
  streak: number
  bestStreak: number
  level: number // 1..10
  maxFactor: number // 2..10
  totalCorrect: number
  totalAttempts: number
  soundOn: boolean
  unlocked: Record<string, boolean>
  language?: 'en' | 'ru' | 'he'
  theme?: 'buzz' | 'barbie'
}

export type GameState = {
  profile: ProfileState
  mastery: Record<string, Mastery>
  recentMistakes: string[] // queue of mastery keys
  lastOp?: Op
  language?: 'en' | 'ru' | 'he'
  theme?: 'buzz' | 'barbie'
  sessionStartAt?: number
  sessionAttempts: number
  sessionCorrect: number
  lastSession?: { durationMs: number; attempts: number; correct: number }
}

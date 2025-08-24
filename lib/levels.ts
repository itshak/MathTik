import problems from '@/lib/data/problems.json'
import type { Op } from '@/lib/types'

export type Fact = {
  id: string
  op: Op
  a: number
  b: number
  answer: number
  level: number
}

const FACTS: Fact[] = (problems as any).facts

export function factsByLevel(level: number): Fact[] {
  return FACTS.filter(f => f.level === level)
}

export function factsUpToLevel(level: number): Fact[] {
  return FACTS.filter(f => f.level <= level)
}

export function pickRandomForLevel(level: number): Fact {
  return pickFromLevel(level, 0.2)
}

export function pickFromLevel(level: number, priorRatio: number): Fact {
  const current = factsByLevel(level)
  const prior = factsUpToLevel(level - 1)
  const usePrior = level > 1 && prior.length > 0 && Math.random() < priorRatio
  const pool = usePrior ? prior : current
  return pool[Math.floor(Math.random() * pool.length)]
}

"use client"
import { CoinStack } from '@/components/illustrations/Coin'

export function splitIntoStacks(n: number): (1|2|3|4|5)[] {
  const res: (1|2|3|4|5)[] = []
  let r = Math.max(0, Math.floor(n))
  const push = (k: number) => { if (k>=1) res.push(Math.min(5, Math.max(1, k)) as 1|2|3|4|5) }
  while (r >= 5) { push(5); r -= 5 }
  // greedy for remainder
  const rest = [4,3,2,1]
  for (const k of rest) { while (r >= k) { push(k); r -= k } }
  return res
}

export function CoinCountView({ count, size }: { count: number; size: number }) {
  const stacks = splitIntoStacks(count)
  const token = Math.max(20, Math.min(size, 40))
  return (
    <div className="flex flex-wrap gap-1" style={{ minHeight: token }}>
      {stacks.map((c, i) => (
        <div key={i} className="rounded-md bg-white shadow-soft grid place-items-center" style={{ width: token, height: token }}>
          <CoinStack count={c} size={token} />
        </div>
      ))}
    </div>
  )
}

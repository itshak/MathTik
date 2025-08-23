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
  const coinSize = Math.round(token * 0.8)
  const overlap = Math.max(2, Math.round(token * 0.2))
  const hFor = (c: number) => coinSize + overlap * (c - 1)
  const minH = stacks.length ? Math.max(...stacks.map(hFor)) : coinSize
  return (
    <div className="flex flex-wrap items-center gap-1" style={{ minHeight: minH }}>
      {stacks.map((c, i) => (
        <div key={i} className="rounded-md bg-white shadow-soft grid place-items-center" style={{ width: token, height: hFor(c) }}>
          <CoinStack count={c} size={token} />
        </div>
      ))}
    </div>
  )
}

// Advanced renderer with overlays and pointer
export function CoinStacks(
  { count, size, overlayNumbers, pointerIndex, rtl }:
  { count: number; size: number; overlayNumbers?: number[]; pointerIndex?: number; rtl?: boolean }
) {
  const stacks = splitIntoStacks(count)
  const token = Math.max(20, Math.min(size, 40))
  const coinSize = Math.round(token * 0.8)
  const overlap = Math.max(2, Math.round(token * 0.2))
  const hFor = (c: number) => coinSize + overlap * (c - 1)
  const minH = stacks.length ? Math.max(...stacks.map(hFor)) : coinSize
  return (
    <div className="flex flex-wrap items-center gap-1" style={{ minHeight: minH }}>
      {stacks.map((c, i) => (
        <div key={i} className="relative rounded-md bg-white shadow-soft grid place-items-center" style={{ width: token, height: hFor(c) }}>
          <CoinStack count={c} size={token} />
          {overlayNumbers && typeof overlayNumbers[i] === 'number' && (
            <span className="absolute inset-0 grid place-items-center text-xs sm:text-sm lg:text-base font-black text-white num-stroke">{overlayNumbers[i]}</span>
          )}
          {typeof pointerIndex === 'number' && pointerIndex === i && (
            <span className={`absolute ${rtl ? '-right-5' : '-left-5'} top-[35%] pointer-events-none text-lg ${rtl ? 'animate-pointer-rtl' : 'animate-pointer'}`}>{rtl ? '👈' : '👉'}</span>
          )}
        </div>
      ))}
    </div>
  )
}

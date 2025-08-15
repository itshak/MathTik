export const rand = (n: number) => Math.floor(Math.random() * n)
export const choice = <T,>(arr: T[]): T => arr[rand(arr.length)]
export const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))

export const keyFor = (op: 'mul'|'div', a: number, b: number) => op === 'mul' ? `m:${a}x${b}` : `d:${a}/${b}`

export function nowSec() { return Math.floor(Date.now() / 1000) }

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

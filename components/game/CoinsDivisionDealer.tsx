"use client"
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Person } from '@/components/illustrations/Person'
import { Coin } from '@/components/illustrations/Coin'
import { CoinStacks, splitIntoStacks } from './CoinUtils'
import { audio } from '@/lib/audio'
import { DraggableItem, DroppableZone } from './dnd'
import { useI18n } from '@/lib/i18n'
import { useGameStore } from '@/lib/store'

export function CoinsDivisionDealer({ a, b, mistake, onReady, mistakes, maxH }: { a: number; b: number; mistake?: boolean; onReady?: () => void; mistakes?: number; maxH?: number }) {
  const t = useI18n()
  const lang = useGameStore(s => s.profile.language || 'en')
  const isRTL = lang === 'he'
  const q = Math.floor(a / b)
  const [pool, setPool] = useState<number>(() => a)
  const [friends, setFriends] = useState<number[]>(() => Array.from({ length: b }, () => 0))
  const [lastId, setLastId] = useState<number | null>(null)
  const nextId = useRef(0)
  const autoTimer = useRef<number | null>(null)
  const autoRunId = useRef(0)
  const readySent = useRef(false)
  const stepping = useRef(false)

  useEffect(() => { readySent.current = false }, [mistakes])
  useEffect(() => { setPool(a); setFriends(Array.from({ length: b }, () => 0)); nextId.current = 0 }, [a, b])

  useEffect(() => {
    const done = pool === 0 && friends.every(f => f === q)
    if (done && !readySent.current) { readySent.current = true; onReady?.() }
  }, [pool, friends, q, onReady])

  useEffect(() => {
    if (!mistake) return
    const needs = friends.map(f => Math.max(0, q - f))
    const seq: number[] = []
    needs.forEach((n, idx) => { for (let k = 0; k < n; k++) seq.push(idx) })
    let i = 0
    autoRunId.current += 1
    const thisRun = autoRunId.current
    const step = () => {
      if (thisRun !== autoRunId.current) { stepping.current = false; return }
      if (i >= seq.length) { stepping.current = false; if (!readySent.current) { readySent.current = true; onReady?.() } return }
      if (pool <= 0) { stepping.current = false; if (!readySent.current) { readySent.current = true; onReady?.() } return }
      const tgt = seq[i++]
      setPool(p => Math.max(0, p - 1))
      setFriends(prev => prev.map((f, idx) => idx === tgt ? Math.min(q, f + 1) : f))
      setLastId(nextId.current++)
      stepping.current = true
      autoTimer.current = window.setTimeout(step, 160)
    }
    // Defer first step to avoid StrictMode double-invocation issues
    if (autoTimer.current) { clearTimeout(autoTimer.current); autoTimer.current = null }
    stepping.current = false
    autoTimer.current = window.setTimeout(step, 0)
    return () => { autoRunId.current += 1; if (autoTimer.current) { clearTimeout(autoTimer.current); autoTimer.current = null }; stepping.current = false }
  }, [mistake])

  function onDragStart() { audio.drag() }

  function onDragEnd(ev: DragEndEvent) {
    if (typeof mistakes === 'number' && mistakes >= 1) return
    const overId = ev.over?.id as string | undefined
    if (!overId) return
    audio.drop()
    if (!overId.startsWith('friend-')) return
    const idx = parseInt(overId.split('-')[1])
    if (isNaN(idx)) return
    if (friends[idx] >= q) return
    if (pool <= 0) return
    setPool(p => Math.max(0, p - 1))
    setFriends(prev => prev.map((f, i) => i === idx ? Math.min(q, f + 1) : f))
    setLastId(nextId.current++)
  }

  // Layout sizing
  const outerCols = useMemo(() => {
    if (b >= 8) return 5
    if (b >= 6) return 4
    return Math.min(3, b)
  }, [b])

  const token = useMemo(() => {
    if (b >= 8) return 32
    if (b >= 6) return 36
    return 40
  }, [b])

  const stacks = useMemo(() => splitIntoStacks(pool), [pool])
  // Overlays for numbers on stacks
  const overlays = useMemo(() => {
    if (typeof mistakes !== 'number') return [] as (number[] | undefined)[]
    return friends.map((cnt, idx) => {
      const s = splitIntoStacks(cnt)
      if (mistakes >= 3) { let sum = 0; return s.map(v => (sum += v)) }
      if (mistakes === 2 && idx === 0) {
        if (s.length === 0) return undefined
        let sum = 0
        // show cumulative counts on all previous stacks, leave last without number
        return s.map((v, i) => i < s.length - 1 ? (sum += v) : (undefined as unknown as number))
      }
      return undefined
    })
  }, [mistakes, friends])
  // Index of the stack to place a question mark on (second mistake)
  const questions = useMemo(() => {
    if (typeof mistakes !== 'number') return [] as (number | undefined)[]
    return friends.map((cnt, idx) => {
      const s = splitIntoStacks(cnt)
      if (mistakes === 2 && idx === 0 && s.length > 0) return s.length - 1
      return undefined
    })
  }, [mistakes, friends])
  // Pointer index per friend
  const pointers = useMemo(() => {
    if (typeof mistakes !== 'number') return [] as (number | undefined)[]
    return friends.map((cnt, idx) => {
      const s = splitIntoStacks(cnt)
      if (idx !== 0 || s.length === 0) return undefined
      if (mistakes === 1) return 0
      if (mistakes === 2) return s.length - 1
      return undefined
    })
  }, [mistakes, friends])

  // Compute pool tile dimensions to avoid clipping stacked coins
  const poolCoinSize = useMemo(() => Math.round(token * 0.8), [token])
  const poolOverlap = useMemo(() => Math.max(2, Math.round(token * 0.2)), [token])
  const poolStackHeight = (c: number) => poolCoinSize + poolOverlap * (c - 1)
  // Fixed baseline: reserve height for a full 5-coin stack to prevent layout shifts
  const poolMinH = useMemo(() => poolStackHeight(5), [poolCoinSize, poolOverlap])
  // Corner icon sizing and padding to avoid overlap
  const iconSize = useMemo(() => Math.round(token * 1.3), [token])
  const iconPad = useMemo(() => Math.max(8, Math.round(iconSize * 0.6)), [iconSize])
  // Pool needs extra room so its icon never overlaps with many stacks
  const poolIconPad = useMemo(() => Math.max(12, Math.round(iconSize * 1.2)), [iconSize])

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className={`grid grid-cols-1 gap-3 ${mistake ? 'ring-2 ring-red-300 ring-offset-2' : ''}`}>
        {/* Pool */}
        <div className="relative border border-gray-300 rounded-xl p-2" style={{ [isRTL ? 'paddingRight' : 'paddingLeft']: poolIconPad } as CSSProperties}>
          <span className={`pointer-events-none absolute top-1 ${isRTL ? 'right-1' : 'left-1'} text-gray-400 z-0`} style={{ fontSize: iconSize }}>🗃️</span>
          <DroppableZone id="pool" className={`relative z-20 flex flex-nowrap items-center overflow-x-auto gap-2 py-1 ${(typeof mistakes === 'number' && mistakes >= 1) ? 'pointer-events-none opacity-95' : ''}`} style={{ minHeight: poolMinH }}>
            {stacks.map((c, si) => {
              const coinSize = poolCoinSize
              const overlap = poolOverlap
              const tileH = poolStackHeight(c)
              return (
                <div key={`s-${si}-${lastId ?? 0}`} className="relative rounded-md bg-white shadow-soft" style={{ width: token, height: tileH }}>
                  {/* Render c coins as independent draggables stacked visually */}
                  <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                    <div style={{ position: 'relative', width: coinSize, height: tileH }}>
                      {Array.from({ length: c }).map((_, ci) => {
                        const id = `p-${si}-${ci}-${lastId ?? 0}`
                        return (
                          <div key={id} style={{ position: 'absolute', left: 0, right: 0, bottom: ci * overlap, display: 'grid', placeItems: 'center', zIndex: 10 + ci }}>
                            <DraggableItem id={id}>
                              <div className={`grid place-items-center ${ci===c-1 ? 'animate-pop' : ''}`} style={{ width: coinSize, height: coinSize }}>
                                <Coin size={coinSize} />
                              </div>
                            </DraggableItem>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </DroppableZone>
        </div>

        {/* Friends */}
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${outerCols}, minmax(0, 1fr))` }}>
          {friends.map((cnt, i) => (
            <div key={i} className="relative border border-gray-300 rounded-xl p-1" style={{ [isRTL ? 'paddingRight' : 'paddingLeft']: iconPad } as CSSProperties}>
              <span className={`pointer-events-none absolute top-1 ${isRTL ? 'right-1' : 'left-1'} opacity-80`}>
                <Person size={Math.round(token * 1.3)} />
              </span>
              <DroppableZone id={`friend-${i}`} className="grid place-items-center py-1">
                <CoinStacks count={cnt} size={token} overlayNumbers={overlays[i]} questionIndex={questions[i]} pointerIndex={pointers[i]} rtl={isRTL} />
              </DroppableZone>
            </div>
          ))}
        </div>
      </div>
    </DndContext>
  )
}

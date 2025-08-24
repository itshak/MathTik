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

export function CoinsMultiplyGroups({ a, b, mistake, onReady, mistakes, maxH }: { a: number; b: number; mistake?: boolean; onReady?: () => void; mistakes?: number; maxH?: number }) {
  const t = useI18n()
  const lang = useGameStore(s => s.profile.language || 'en')
  const isRTL = lang === 'he'
  const total = a * b
  const [pool, setPool] = useState<number>(() => 0)
  const [groups, setGroups] = useState<number[]>(() => Array.from({ length: a }, () => b))
  const [lastId, setLastId] = useState<number | null>(null)
  const nextId = useRef(0)
  const autoTimer = useRef<number | null>(null)
  const autoRunId = useRef(0)
  const readySent = useRef(false)

  useEffect(() => { readySent.current = false }, [mistakes])
  useEffect(() => { setPool(0); setGroups(Array.from({ length: a }, () => b)); nextId.current = 0 }, [a, b, total])

  useEffect(() => {
    const done = pool === total
    if (done && !readySent.current) { readySent.current = true; onReady?.() }
  }, [pool, total, onReady])

  useEffect(() => {
    if (!mistake) return
    // move coins from groups to pool until pool reaches total
    const seq: number[] = []
    groups.forEach((g, idx) => { for (let k = 0; k < g; k++) seq.push(idx) })
    let i = 0
    autoRunId.current += 1
    const thisRun = autoRunId.current
    const step = () => {
      if (thisRun !== autoRunId.current) return
      if (i >= seq.length) { if (!readySent.current) { readySent.current = true; onReady?.() } return }
      const src = seq[i++]
      setGroups(prev => prev.map((g, idx) => idx === src ? Math.max(0, g - 1) : g))
      setPool(p => Math.min(total, p + 1))
      setLastId(nextId.current++)
      autoTimer.current = window.setTimeout(step, 160)
    }
    // Defer first step to next tick to avoid StrictMode double-effect immediate run
    if (autoTimer.current) { clearTimeout(autoTimer.current); autoTimer.current = null }
    autoTimer.current = window.setTimeout(step, 0)
    return () => { autoRunId.current += 1; if (autoTimer.current) { clearTimeout(autoTimer.current); autoTimer.current = null } }
  }, [mistake])

  function onDragStart() { audio.drag() }

  function onDragEnd(ev: DragEndEvent) {
    if (typeof mistakes === 'number' && mistakes >= 1) return
    const overId = ev.over?.id as string | undefined
    if (!overId) return
    audio.drop()
    // Only handle drops to pool from groups
    if (overId !== 'pool') return
    const activeId = String(ev.active.id)
    if (!activeId.startsWith('g-')) return
    const parts = activeId.split('-')
    const idx = parseInt(parts[1])
    if (isNaN(idx)) return
    if (groups[idx] <= 0) return
    setGroups(prev => prev.map((g, i) => i === idx ? Math.max(0, g - 1) : g))
    setPool(p => Math.min(total, p + 1))
    setLastId(nextId.current++)
  }

  // Layout sizing
  const outerCols = useMemo(() => {
    if (a >= 8) return 5
    if (a >= 6) return 4
    return Math.min(3, a)
  }, [a])

  const token = useMemo(() => {
    if (a >= 8) return 32
    if (a >= 6) return 36
    return 40
  }, [a])

  const poolStacks = useMemo(() => splitIntoStacks(pool), [pool])
  // Pool overlays for numbers on stacks
  const poolOverlays = useMemo(() => {
    if (typeof mistakes !== 'number') return undefined as unknown as number[]
    if (poolStacks.length === 0) return undefined as unknown as number[]
    if (mistakes >= 3) { let sum = 0; return poolStacks.map(v => (sum += v)) }
    if (mistakes === 2) { let sum = 0; return poolStacks.map((v, i) => i < poolStacks.length - 1 ? (sum += v) : (undefined as unknown as number)) }
    return undefined as unknown as number[]
  }, [mistakes, poolStacks])
  const poolQuestionIndex = useMemo(() => {
    if (typeof mistakes !== 'number') return undefined
    if (mistakes === 2 && poolStacks.length > 0) return poolStacks.length - 1
    return undefined
  }, [mistakes, poolStacks])
  const poolPointerIndex = useMemo(() => {
    if (typeof mistakes !== 'number') return undefined
    if (poolStacks.length === 0) return undefined
    if (mistakes === 1) return 0
    if (mistakes === 2) return poolStacks.length - 1
    return undefined
  }, [mistakes, poolStacks])

  // Compute stack tile dimensions to avoid clipping stacked coins
  const coinSize = useMemo(() => Math.round(token * 0.8), [token])
  const overlap = useMemo(() => Math.max(2, Math.round(token * 0.2)), [token])
  const stackHeight = (c: number) => coinSize + overlap * (c - 1)
  // Fixed baseline: reserve height for a full 5-coin stack to prevent layout shifts
  const minStackH = useMemo(() => stackHeight(5), [coinSize, overlap])
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
          <span className={`pointer-events-none absolute top-1 ${isRTL ? 'right-1' : 'left-1'} text-gray-400`} style={{ fontSize: iconSize }}>🗃️</span>
          <DroppableZone id="pool" className={`flex flex-nowrap items-center overflow-x-auto gap-2 py-1 ${(typeof mistakes === 'number' && mistakes >= 1) ? 'pointer-events-none opacity-95' : ''}`} style={{ minHeight: minStackH }}>
            <CoinStacks count={pool} size={token} overlayNumbers={poolOverlays as unknown as number[]} questionIndex={poolQuestionIndex as number} pointerIndex={poolPointerIndex as number} rtl={isRTL} />
          </DroppableZone>
        </div>

        {/* Groups */}
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${outerCols}, minmax(0, 1fr))` }}>
          {groups.map((cnt, i) => (
            <div key={i} className="relative border border-gray-300 rounded-xl p-1" style={{ [isRTL ? 'paddingRight' : 'paddingLeft']: iconPad } as CSSProperties}>
              <span className={`pointer-events-none absolute top-1 ${isRTL ? 'right-1' : 'left-1'} opacity-80`}>
                <Person size={Math.round(token * 1.3)} />
              </span>
              <DroppableZone id={`group-${i}`} className="grid place-items-center py-1" style={{ minHeight: minStackH }}>
                {/* Render cnt coins as independent draggables stacked visually */}
                {splitIntoStacks(cnt).map((c, si) => {
                  const tileH = stackHeight(c)
                  return (
                    <div key={`g-${i}-s-${si}-${lastId ?? 0}`} className="relative rounded-md bg-white shadow-soft" style={{ width: token, height: tileH }}>
                      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                        <div style={{ position: 'relative', width: coinSize, height: tileH }}>
                          {Array.from({ length: c }).map((_, ci) => {
                            const id = `g-${i}-s-${si}-c-${ci}-${lastId ?? 0}`
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
          ))}
        </div>
      </div>
    </DndContext>
  )
}

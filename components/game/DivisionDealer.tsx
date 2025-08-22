"use client"
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Apple } from '@/components/illustrations/Apple'
import { Person } from '@/components/illustrations/Person'
import { audio } from '@/lib/audio'
import { DraggableItem, DroppableZone } from './dnd'
import { useI18n } from '@/lib/i18n'
import { useGameStore } from '@/lib/store'

export function DivisionDealer({ a, b, mistake, onReady, mistakes, maxH }: { a: number; b: number; mistake?: boolean; onReady?: () => void; mistakes?: number; maxH?: number }) {
  const t = useI18n()
  const lang = useGameStore(s => s.profile.language || 'en')
  const isRTL = lang === 'he'
  const q = Math.floor(a / b)
  const [pool, setPool] = useState<number[]>(() => Array.from({ length: a }, (_, i) => i))
  const [friends, setFriends] = useState<number[][]>(() => Array.from({ length: b }, () => []))
  const [autoSolving, setAutoSolving] = useState(false)
  const [lastAdded, setLastAdded] = useState<number | null>(null)
  const [countIdx, setCountIdx] = useState<number>(-1) // for animated counting across apples
  const autoTimer = useRef<number | null>(null)
  const autoRunId = useRef(0)
  const countTimer = useRef<number | null>(null)
  const countPos = useRef<number>(-1)
  const readySent = useRef(false)

  // Reset ready gate when mistakes count changes
  useEffect(() => { readySent.current = false }, [mistakes])

  useEffect(() => { setPool(Array.from({ length: a }, (_, i) => i)); setFriends(Array.from({ length: b }, () => [])) }, [a,b])

  useEffect(() => {
    const done = pool.length === 0 && friends.every(f => f.length === q)
    if (done && !readySent.current) { readySent.current = true; onReady?.() }
  }, [pool.length, friends, q])

  // Auto-solve: distribute remaining pool apples to friends until each has q (deterministic sequence)
  // Important: depend ONLY on `mistake` so re-renders from state changes don't clear the timer mid-run.
  useEffect(() => {
    if (!mistake) return
    setAutoSolving(true)

    // Build the exact target sequence based on current deficit per friend
    const needs = friends.map(f => Math.max(0, q - f.length))
    const seq: number[] = []
    needs.forEach((n, idx) => { for (let k = 0; k < n; k++) seq.push(idx) })
    // Stable queue of ids to move (only as many as needed)
    const idsQueue = pool.slice(0, seq.length)
    let i = 0
    autoRunId.current += 1
    const thisRun = autoRunId.current

    const step = () => {
      if (thisRun !== autoRunId.current) return
      if (i >= seq.length) {
        setAutoSolving(false)
        // For first mistake, finish now; for subsequent mistakes, counting animation will call onReady
        if (!mistakes || mistakes < 2) { if (!readySent.current) { readySent.current = true; onReady?.() } }
        return
      }
      const tgt = seq[i++]
      const id = idsQueue[i-1]
      // Remove this id from pool and append to target, but never exceed capacity
      setPool(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev)
      setFriends(prevF => prevF.map((f, idx) => {
        if (idx !== tgt) return f
        if (f.length >= q) return f
        // Avoid accidental duplication of the same id
        if (f.includes(id)) return f
        return [...f, id]
      }))
      setLastAdded(id)
      autoTimer.current = window.setTimeout(step, 180)
    }

    step()
    return () => { autoRunId.current += 1; if (autoTimer.current) { clearTimeout(autoTimer.current); autoTimer.current = null } }
  }, [mistake])

  // Counting guidance animation for mistakes >= 2 (stable across re-renders)
  useEffect(() => {
    // clear any previous timer
    if (countTimer.current) { clearTimeout(countTimer.current); countTimer.current = null }
    countPos.current = -1

    if (autoSolving || !mistakes) { setCountIdx(-1); return }
    if (mistakes >= 3) { setCountIdx(q - 1); if (!readySent.current) { readySent.current = true; onReady?.() } return }
    if (mistakes >= 2) {
      const tick = () => {
        countPos.current = Math.min(q - 1, countPos.current + 1)
        setCountIdx(countPos.current)
        if (countPos.current < q - 1) {
          countTimer.current = window.setTimeout(tick, 600)
        } else {
          // reached last apple, now user must count it – then re-enable input
          if (!readySent.current) { readySent.current = true; onReady?.() }
        }
      }
      tick()
      return () => { if (countTimer.current) { clearTimeout(countTimer.current); countTimer.current = null } }
    }
    setCountIdx(-1)
  }, [mistakes, q, autoSolving])

  function onDragStart() { audio.drag() }

  function onDragEnd(ev: DragEndEvent) {
    // Lock board after first mistake so apples remain placed for this question
    if (typeof mistakes === 'number' && mistakes >= 1) return
    const id = Number(ev.active.id)
    const overId = ev.over?.id as string | undefined
    if (!overId) return
    audio.drop()

    // find current location
    const fi = friends.findIndex(f => f.includes(id))
    const inPool = fi === -1

    if (overId === 'pool') {
      // allow returning to pool for corrections
      if (!inPool) {
        setFriends(prev => prev.map((f, idx) => idx === fi ? f.filter(x => x !== id) : f))
        setPool(prev => [...prev, id])
      }
      return
    }

    if (overId.startsWith('friend-')) {
      const tgt = parseInt(overId.split('-')[1])
      if (isNaN(tgt)) return
      if (friends[tgt].length >= q) return // capacity reached
      if (inPool) {
        setPool(prev => prev.filter(x => x !== id))
        setFriends(prev => prev.map((f, idx) => idx === tgt ? [...f, id] : f))
      } else {
        if (fi === tgt) return
        setFriends(prev => prev.map((f, idx) => {
          if (idx === fi) return f.filter(x => x !== id)
          if (idx === tgt) return [...f, id]
          return f
        }))
      }
    }
  }

  // Responsive sizing
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerW, setContainerW] = useState(0)
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setContainerW(Math.floor(e.contentRect.width))
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Outer grid columns (number of people per row) — depends on number of friends (b)
  const outerCols = useMemo(() => {
    if (b >= 6) {
      if (containerW < 420) return Math.min(4, b)
      if (containerW < 640) return Math.min(3, b)
    }
    return Math.min(3, b)
  }, [b, containerW])

  // Inner per-friend layout and tile size
  const innerCols = Math.min(10, q)
  const gridGap = 12 // gap-3
  const innerGap = 8 // gap-2
  const cardW = containerW > 0 ? Math.floor((containerW - gridGap * (outerCols - 1)) / Math.max(outerCols, 1)) : 320
  const tile = useMemo(() => {
    // Width constraint
    const tileByW = Math.floor((cardW - innerGap * (innerCols - 1)) / Math.max(innerCols, 1))
    let maxTile = Math.max(24, Math.min(140, tileByW))

    if (!maxH || maxH <= 0) return maxTile

    function totalHeightFor(t: number) {
      // Pool: one row of tiles
      const poolHeaderH = 16
      const poolPadding = 24 // p-3 top+bottom
      const poolSpacing = 8 // mt-2
      const poolH = poolPadding + poolHeaderH + poolSpacing + t

      // Friend card
      const headerH = Math.round(t * 0.9)
      const rowsInCard = Math.ceil(q / innerCols)
      const appleGridH = rowsInCard * t + Math.max(0, rowsInCard - 1) * innerGap
      const cardPadding = 24 // p-2 top+bottom plus margins
      const cardH = headerH + 8 /* mt-2 */ + appleGridH + cardPadding

      const gridRows = Math.ceil(b / outerCols)
      const friendsH = gridRows * cardH + Math.max(0, gridRows - 1) * gridGap

      const outerGapY = gridGap
      return poolH + outerGapY + friendsH
    }

    let lo = 24, hi = maxTile, best = 24
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      if (totalHeightFor(mid) <= maxH) { best = mid; lo = mid + 1 } else { hi = mid - 1 }
    }
    return best
  }, [cardW, innerCols, q, b, outerCols, innerGap, gridGap, maxH])
  const appleSize = Math.max(20, Math.round(tile * 0.75))

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className={`grid grid-cols-1 gap-3 ${mistake ? 'ring-2 ring-red-300 ring-offset-2' : ''}`}>
        {/* Pool (no text) */}
        <div className="border border-gray-300 rounded-xl p-3">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <span className="text-xl">🗃️</span>
          </div>
          <DroppableZone id="pool" className={`mt-2 flex flex-nowrap overflow-x-auto gap-2 ${typeof mistakes === 'number' && mistakes >= 1 ? 'pointer-events-none opacity-95' : ''}`} style={{ minHeight: tile }}>
            {pool.map(id => (
              <DraggableItem id={id} key={id}>
                <div className={`rounded-xl grid place-items-center bg-white shadow-soft ${lastAdded===id?'animate-pop':''}`} style={{ width: tile, height: tile }}>
                  <Apple size={appleSize} />
                </div>
              </DraggableItem>
            ))}
          </DroppableZone>
        </div>

        {/* Friends */}
        <div
          ref={containerRef}
          className={`grid gap-3 ${(autoSolving || (typeof mistakes === 'number' && mistakes >= 1)) ? 'pointer-events-none opacity-95' : ''}`}
          style={{ gridTemplateColumns: `repeat(${outerCols}, minmax(0, 1fr))` }}
        >
          {friends.map((f, i) => (
            <div key={i} className="border border-gray-300 rounded-xl p-2 relative">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Person size={Math.round(tile * 0.9)} />
              </div>
              <DroppableZone id={`friend-${i}`} className="mt-2 flex flex-wrap gap-2" style={{ minHeight: tile }}>
                {f.map((id, j) => (
                  <DraggableItem id={id} key={id}>
                    <div className={`rounded-xl grid place-items-center bg-white shadow-soft ${lastAdded===id?'animate-pop':''} relative`} style={{ width: tile, height: tile }}>
                      <Apple size={appleSize} />
                      {/* Counting overlays */}
                      {typeof mistakes === 'number' && ((mistakes >= 3) || (mistakes >= 2 && i === 0)) && (
                        <span className="absolute inset-0 grid place-items-center text-sm sm:text-base lg:text-lg font-black text-white num-stroke">
                          {mistakes >= 3 ? String(j + 1) : (j < countIdx ? String(j + 1) : (j === q - 1 ? '?' : ''))}
                        </span>
                      )}
                      {/* Moving pointer: outside the apple, pointing to it */}
                      {typeof mistakes === 'number' && mistakes === 2 && i === 0 && j === Math.min(countIdx, q - 1) && (
                        <span className={`absolute ${isRTL ? '-right-6' : '-left-6'} top-[35%] pointer-events-none text-2xl ${isRTL ? 'animate-pointer-rtl' : 'animate-pointer'}`}>{isRTL ? '👈' : '👉'}</span>
                      )}
                      {/* First mistake: static pointer outside first apple of first friend */}
                      {typeof mistakes === 'number' && mistakes === 1 && i === 0 && j === 0 && (
                        <span className={`absolute ${isRTL ? '-right-6' : '-left-6'} top-[35%] pointer-events-none text-2xl ${isRTL ? 'animate-pointer-rtl' : 'animate-pointer'}`}>{isRTL ? '👈' : '👉'}</span>
                      )}
                    </div>
                  </DraggableItem>
                ))}
                {Array.from({ length: Math.max(0, q - f.length) }).map((_, k) => (
                  <div key={k} className="rounded-xl border border-gray-200" style={{ width: tile, height: tile }} />
                ))}
              </DroppableZone>
              {/* removed totals to avoid giving away answer */}
            </div>
          ))}
        </div>
      </div>
    </DndContext>
  )
}

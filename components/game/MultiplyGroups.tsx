"use client"
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Apple } from '@/components/illustrations/Apple'
import { Person } from '@/components/illustrations/Person'
import { audio } from '@/lib/audio'
import { DraggableItem, DroppableZone } from './dnd'
import { useI18n } from '@/lib/i18n'
import { useGameStore } from '@/lib/store'

export function MultiplyGroups({ a, b, mistake, onReady, mistakes, maxH }: { a: number; b: number; mistake?: boolean; onReady?: () => void; mistakes?: number; maxH?: number }) {
  const t = useI18n()
  const lang = useGameStore(s => s.profile.language || 'en')
  const isRTL = lang === 'he'
  const total = a * b
  // Start with apples distributed to groups; pool empty (avoid first-frame flicker)
  const [pool, setPool] = useState<number[]>(() => [])
  const [groups, setGroups] = useState<number[][]>(() => {
    const ids = Array.from({ length: total }, (_, i) => i)
    const g: number[][] = Array.from({ length: a }, () => [])
    let p = 0
    for (let gi = 0; gi < a; gi++) {
      for (let k = 0; k < b; k++) g[gi].push(ids[p++])
    }
    return g
  })
  const [autoSolving, setAutoSolving] = useState(false)
  const [lastAdded, setLastAdded] = useState<number | null>(null)
  const [countIdx, setCountIdx] = useState(-1)
  const autoTimer = useRef<number | null>(null)
  const autoRunId = useRef(0)
  const countTimer = useRef<number | null>(null)
  const countPos = useRef(-1)
  const readySent = useRef(false)

  // Reset ready gate when mistakes count changes
  useEffect(() => { readySent.current = false }, [mistakes])

  useEffect(() => {
    // Start with apples distributed to groups (a groups, b each); pool is empty
    const ids = Array.from({ length: total }, (_, i) => i)
    const g: number[][] = Array.from({ length: a }, () => [])
    let p = 0
    for (let gi = 0; gi < a; gi++) {
      for (let k = 0; k < b; k++) {
        g[gi].push(ids[p++])
      }
    }
    setGroups(g)
    setPool([])
  }, [a, b, total])

  // Ready when all apples are in the pool (after user or auto-solve finishes)
  useEffect(() => {
    const done = pool.length === total
    if (done && !readySent.current) { readySent.current = true; onReady?.() }
  }, [pool.length, total])

  // Auto-solve: move all apples from groups into pool (deterministic sequence)
  // Depend only on `mistake` so re-renders from state changes don't cancel the timer mid-run.
  useEffect(() => {
    if (!mistake) return
    setAutoSolving(true)
    // Build stable queue of ids to move from current groups to pool
    const idsQueue: number[] = []
    groups.forEach(g => g.forEach(id => idsQueue.push(id)))
    let i = 0
    autoRunId.current += 1
    const thisRun = autoRunId.current
    const step = () => {
      if (thisRun !== autoRunId.current) return
      if (i >= idsQueue.length) {
        setAutoSolving(false)
        if (!mistakes || mistakes < 2) { if (!readySent.current) { readySent.current = true; onReady?.() } }
        return
      }
      const id = idsQueue[i++]
      // Remove the id from any group; append to pool if not present
      setGroups(prevG => prevG.map(g => g.includes(id) ? g.filter(x => x !== id) : g))
      setPool(prev => prev.includes(id) ? prev : [...prev, id])
      setLastAdded(id)
      autoTimer.current = window.setTimeout(step, 180)
    }
    step()
    return () => { autoRunId.current += 1; if (autoTimer.current) { clearTimeout(autoTimer.current); autoTimer.current = null } }
  }, [mistake])

  // Counting guidance for mistakes >= 2: count apples in the POOL; on 3rd mistake, number all apples in the pool
  useEffect(() => {
    if (countTimer.current) { clearTimeout(countTimer.current); countTimer.current = null }
    countPos.current = -1
    if (autoSolving || !mistakes) { setCountIdx(-1); return }
    if (mistakes >= 3) { setCountIdx(total - 1); if (!readySent.current) { readySent.current = true; onReady?.() } return }
    if (mistakes >= 2) {
      const tick = () => {
        countPos.current = Math.min(total - 1, countPos.current + 1)
        setCountIdx(countPos.current)
        if (countPos.current < total - 1) {
          countTimer.current = window.setTimeout(tick, 600)
        } else {
          if (!readySent.current) { readySent.current = true; onReady?.() }
        }
      }
      tick()
      return () => { if (countTimer.current) { clearTimeout(countTimer.current); countTimer.current = null } }
    }
    setCountIdx(-1)
  }, [mistakes, total, autoSolving])

  function onDragStart() { audio.drag() }

  function onDragEnd(ev: DragEndEvent) {
    if (typeof mistakes === 'number' && mistakes >= 1) return
    const id = Number(ev.active.id)
    const overId = ev.over?.id as string | undefined
    if (!overId) return
    audio.drop()

    // locate current container of item
    const gIndex = groups.findIndex(g => g.includes(id))
    const inPool = gIndex === -1

    if (overId === 'pool') {
      // move to pool from group
      if (!inPool) {
        setGroups(prev => prev.map((g, idx) => idx === gIndex ? g.filter(x => x !== id) : g))
        setPool(prev => [...prev, id])
      }
      return
    }

    if (overId.startsWith('group-')) {
      const tgt = parseInt(overId.split('-')[1])
      if (isNaN(tgt)) return
      // only drop if capacity available
      if (groups[tgt].length >= b) return
      if (inPool) {
        setPool(prev => prev.filter(x => x !== id))
        setGroups(prev => prev.map((g, idx) => idx === tgt ? [...g, id] : g))
      } else {
        // move between groups
        if (gIndex === tgt) return
        setGroups(prev => prev.map((g, idx) => {
          if (idx === gIndex) return g.filter(x => x !== id)
          if (idx === tgt) return [...g, id]
          return g
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

  // Outer grid: number of groups per row
  const outerCols = useMemo(() => {
    if (a >= 6) {
      if (containerW < 420) return Math.min(4, a)
      if (containerW < 640) return Math.min(3, a)
    }
    return Math.min(3, a)
  }, [a, containerW])

  // Inner grid: apples per row inside a group
  const innerCols = Math.min(10, b)
  const gridGap = 12 // gap-3
  const innerGap = 8 // gap-2
  const cardW = containerW > 0 ? Math.floor((containerW - gridGap * (outerCols - 1)) / Math.max(outerCols, 1)) : 320
  const tile = useMemo(() => {
    // Width-constrained tile size
    const tileByW = Math.floor((cardW - innerGap * (innerCols - 1)) / Math.max(innerCols, 1))
    let maxTile = Math.max(24, Math.min(140, tileByW))

    // Height constraint: ensure pool + groups fit within maxH (if provided)
    if (!maxH || maxH <= 0) return maxTile

    function totalHeightFor(t: number) {
      // Pool section height (header + spacing + one row of tiles) within p-3 container
      const poolHeaderH = 16
      const poolPadding = 24 // top+bottom from p-3
      const poolSpacing = 8 // mt-2
      const poolH = poolPadding + poolHeaderH + poolSpacing + t

      // Group card height
      const headerH = Math.round(t * 0.9)
      const rowsInCard = Math.ceil(b / innerCols)
      const appleGridH = rowsInCard * t + Math.max(0, rowsInCard - 1) * innerGap
      const cardPadding = 24 // p-2 top+bottom plus small margins
      const cardH = headerH + 8 /* mt-2 */ + appleGridH + cardPadding

      const gridRows = Math.ceil(a / outerCols)
      const groupsH = gridRows * cardH + Math.max(0, gridRows - 1) * gridGap

      // Gap between pool and groups inside outer grid
      const outerGapY = gridGap
      return poolH + outerGapY + groupsH
    }

    // Binary search for largest tile <= maxTile that fits in maxH
    let lo = 24, hi = maxTile, best = 24
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      if (totalHeightFor(mid) <= maxH) { best = mid; lo = mid + 1 } else { hi = mid - 1 }
    }
    return best
  }, [cardW, innerCols, a, b, outerCols, innerGap, gridGap, maxH])
  const appleSize = Math.max(20, Math.round(tile * 0.75))
  // Corner icon sizing and padding (RTL-aware)
  const iconSize = useMemo(() => Math.round(tile * 1.3), [tile])
  const iconPad = useMemo(() => Math.max(8, Math.round(iconSize * 0.6)), [iconSize])
  // Pool needs extra room so its icon never overlaps with many tiles
  // Increase side padding so apples stay clear of the basket and leave room for the pointer
  const poolIconPad = useMemo(() => Math.max(16, Math.round(iconSize * 1.6)), [iconSize])
  // Reserve some vertical space for the corner icons
  const iconTopPad = useMemo(() => Math.max(6, Math.round(iconSize * 0.4)), [iconSize])
  // Groups: add a bit more side padding to keep apples clear of the person icon and future pointer
  const groupIconPad = useMemo(() => Math.max(12, Math.round(iconSize * 0.8)), [iconSize])

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className={`grid grid-cols-1 gap-3 ${mistake ? 'ring-2 ring-red-300 ring-offset-2' : ''}`}>
        {/* Pool (placed first to remain visible even on small heights) */}
        <div className="relative border border-gray-300 rounded-xl p-2" style={{ [isRTL ? 'paddingRight' : 'paddingLeft']: poolIconPad, paddingTop: iconTopPad } as CSSProperties}>
          <span className={`pointer-events-none absolute top-1 ${isRTL ? 'right-1' : 'left-1'} text-gray-400 z-0`} style={{ fontSize: iconSize }}>🧺</span>
          <DroppableZone id="pool" className={`relative z-20 flex flex-nowrap items-center overflow-x-auto gap-2 ${(autoSolving || (typeof mistakes === 'number' && mistakes >= 1)) ? 'pointer-events-none opacity-95' : ''}`} style={{ minHeight: Math.max(tile, iconSize + 8) }}>
            {pool.map((id, j) => (
              <DraggableItem id={id} key={id}>
                <div className={`rounded-xl grid place-items-center bg-white shadow-soft ${lastAdded===id?'animate-pop':''} relative z-20`} style={{ width: tile, height: tile }}>
                  <Apple size={appleSize} />
                  {typeof mistakes === 'number' && (
                    mistakes >= 3 ? (
                      <span className="absolute inset-0 grid place-items-center text-sm sm:text-base lg:text-lg font-black text-white num-stroke">{j + 1}</span>
                    ) : mistakes >= 2 ? (
                      <>
                        <span className="absolute inset-0 grid place-items-center text-sm sm:text-base lg:text-lg font-black text-white num-stroke">{j < countIdx ? String(j + 1) : (j === total - 1 ? '?' : '')}</span>
                        {j === Math.min(countIdx, total - 1) && (
                          <span className={`absolute ${isRTL ? '-right-6' : '-left-6'} top-[35%] pointer-events-none text-2xl z-[999] ${isRTL ? 'animate-pointer-rtl' : 'animate-pointer'}`}>{isRTL ? '👈' : '👉'}</span>
                        )}
                      </>
                    ) : (mistakes === 1 && j === 0) ? (
                      <span className={`absolute ${isRTL ? '-right-6' : '-left-6'} top-[35%] pointer-events-none text-2xl z-[999] ${isRTL ? 'animate-pointer-rtl' : 'animate-pointer'}`}>{isRTL ? '👈' : '👉'}</span>
                    ) : null
                  )}
                </div>
              </DraggableItem>
            ))}
          </DroppableZone>
        </div>

        {/* Groups */}
        <div
          ref={containerRef}
          className={`grid gap-3 ${(autoSolving || (typeof mistakes === 'number' && mistakes >= 1)) ? 'pointer-events-none opacity-95' : ''}`}
          style={{ gridTemplateColumns: `repeat(${outerCols}, minmax(0, 1fr))` }}
        >
          {groups.map((g, i) => (
            <div key={i} className="relative border border-gray-300 rounded-xl p-1" style={{ [isRTL ? 'paddingRight' : 'paddingLeft']: groupIconPad, paddingTop: iconTopPad } as CSSProperties}>
              <span className={`pointer-events-none absolute top-1 ${isRTL ? 'right-1' : 'left-1'} opacity-80`}>
                <Person size={Math.round(tile * 1.3)} />
              </span>
              <DroppableZone id={`group-${i}`} className="flex flex-wrap gap-2" style={{ minHeight: Math.max(tile, iconSize + 8) }}>
                {g.map((id, j) => (
                  <DraggableItem id={id} key={id}>
                    <div className={`rounded-xl grid place-items-center bg-white shadow-soft ${lastAdded===id?'animate-pop':''} relative z-20`} style={{ width: tile, height: tile }}>
                      <Apple size={appleSize} />
                    </div>
                  </DraggableItem>
                ))}
                {/* pad placeholders visually */}
                {Array.from({ length: Math.max(0, b - g.length) }).map((_, k) => (
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

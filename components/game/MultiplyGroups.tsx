"use client"
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Apple } from '@/components/illustrations/Apple'
import { Person } from '@/components/illustrations/Person'
import { audio } from '@/lib/audio'
import { DraggableItem, DroppableZone } from './dnd'
import { useI18n } from '@/lib/i18n'

export function MultiplyGroups({ a, b, mistake, onReady, mistakes }: { a: number; b: number; mistake?: boolean; onReady?: () => void; mistakes?: number }) {
  const t = useI18n()
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
    if (done) onReady?.()
  }, [pool.length, total, onReady])

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
        if (!mistakes || mistakes < 2) onReady?.()
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
    if (mistakes >= 3) { setCountIdx(total - 1); onReady?.(); return }
    if (mistakes >= 2) {
      const tick = () => {
        countPos.current = Math.min(total - 1, countPos.current + 1)
        setCountIdx(countPos.current)
        if (countPos.current < total - 1) {
          countTimer.current = window.setTimeout(tick, 600)
        } else {
          onReady?.()
        }
      }
      tick()
      return () => { if (countTimer.current) { clearTimeout(countTimer.current); countTimer.current = null } }
    }
    setCountIdx(-1)
  }, [mistakes, total, autoSolving, onReady])

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

  // dynamic sizing: slightly smaller to improve fit in viewport
  const cols = Math.min(10, b)
  const tile = useMemo(() => {
    if (cols <= 3) return 84
    if (cols <= 5) return 60
    if (cols <= 8) return 48
    return 36
  }, [cols])
  const appleSize = Math.max(24, Math.round(tile * 0.75))

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className={`grid grid-cols-1 gap-3 ${mistake ? 'ring-2 ring-red-300 ring-offset-2' : ''}`}>
        {/* Pool (placed first to remain visible even on small heights) */}
        <div className="border rounded-xl p-3">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <span>🧺</span><span>{t('pool')}</span>
          </div>
          <DroppableZone id="pool" className={`mt-2 flex flex-wrap gap-2 ${(autoSolving || (typeof mistakes === 'number' && mistakes >= 1)) ? 'pointer-events-none opacity-95' : ''}`} style={{ minHeight: tile }}>
            {pool.map((id, j) => (
              <DraggableItem id={id} key={id}>
                <div className={`rounded-xl grid place-items-center bg-white shadow-soft ${lastAdded===id?'animate-pop':''} relative`} style={{ width: tile, height: tile }}>
                  <Apple size={appleSize} />
                  {typeof mistakes === 'number' && (
                    mistakes >= 3 ? (
                      <span className="absolute inset-0 grid place-items-center text-sm sm:text-base lg:text-lg font-black text-white num-stroke">{j + 1}</span>
                    ) : mistakes >= 2 ? (
                      <>
                        <span className="absolute inset-0 grid place-items-center text-sm sm:text-base lg:text-lg font-black text-white num-stroke">{j < countIdx ? String(j + 1) : (j === total - 1 ? '?' : '')}</span>
                        {j === Math.min(countIdx, total - 1) && (
                          <span className="absolute -left-6 top-[35%] pointer-events-none text-2xl animate-pointer">👉</span>
                        )}
                      </>
                    ) : (mistakes === 1 && j === 0) ? (
                      <span className="absolute -left-6 top-[35%] pointer-events-none text-2xl animate-pointer">👉</span>
                    ) : null
                  )}
                </div>
              </DraggableItem>
            ))}
          </DroppableZone>
        </div>

        {/* Groups */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${(autoSolving || (typeof mistakes === 'number' && mistakes >= 1)) ? 'pointer-events-none opacity-95' : ''}`}>
          {groups.map((g, i) => (
            <div key={i} className="border-2 border-dashed rounded-xl p-2 relative">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Person size={Math.round(tile * 0.9)} /> <span className="text-base">×</span> <Apple size={appleSize} />
              </div>
              <DroppableZone id={`group-${i}`} className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, minHeight: tile }}>
                {g.map((id, j) => (
                  <DraggableItem id={id} key={id}>
                    <div className={`rounded-xl grid place-items-center bg-white shadow-soft ${lastAdded===id?'animate-pop':''} relative`} style={{ width: tile, height: tile }}>
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

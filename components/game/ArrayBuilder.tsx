"use client"
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Apple } from '@/components/illustrations/Apple'
import { audio } from '@/lib/audio'
import { DraggableItem, DroppableZone } from './dnd'
import { useI18n } from '@/lib/i18n'

export function ArrayBuilder({ a, b, mistake, onReady, mistakes }: { a: number; b: number; mistake?: boolean; onReady?: () => void; mistakes?: number }) {
  const t = useI18n()
  const total = a * b
  const [pool, setPool] = useState<number[]>(() => Array.from({ length: total }, (_, i) => i))
  const [cells, setCells] = useState<(number|null)[]>(() => Array.from({ length: total }, () => null))
  const [autoSolving, setAutoSolving] = useState(false)
  const [lastAdded, setLastAdded] = useState<number | null>(null)
  const [countIdx, setCountIdx] = useState(-1)
  const autoTimer = useRef<number | null>(null)
  const autoRunId = useRef(0)
  const countTimer = useRef<number | null>(null)
  const countPos = useRef(-1)

  useEffect(() => { setPool(Array.from({ length: total }, (_, i) => i)); setCells(Array.from({ length: total }, () => null)) }, [a,b])

  useEffect(() => {
    if (cells.every(c => c !== null)) onReady?.()
  }, [cells, onReady])

  // Auto-solve: deterministically fill all empty cells left-to-right from pool
  // Depend only on `mistake` so re-renders from state changes don't cancel the timer mid-run.
  useEffect(() => {
    if (!mistake) return
    setAutoSolving(true)
    const seq: number[] = []
    cells.forEach((c, i) => { if (c === null) seq.push(i) })
    let k = 0
    autoRunId.current += 1
    const thisRun = autoRunId.current
    const step = () => {
      if (thisRun !== autoRunId.current) return
      if (k >= seq.length) {
        setAutoSolving(false)
        if (!mistakes || mistakes < 2) onReady?.()
        return
      }
      const targetIdx = seq[k++]
      setPool(prev => {
        if (prev.length === 0) return prev
        const [id, ...rest] = prev
        setCells(prevCells => prevCells.map((c, i) => i === targetIdx ? id : c))
        setLastAdded(id)
        return rest
      })
      autoTimer.current = window.setTimeout(step, 180)
    }
    step()
    return () => { autoRunId.current += 1; if (autoTimer.current) { clearTimeout(autoTimer.current); autoTimer.current = null } }
  }, [mistake])

  // Counting guidance: on second mistake, move pointer across first row; on third, number all apples
  useEffect(() => {
    if (countTimer.current) { clearTimeout(countTimer.current); countTimer.current = null }
    countPos.current = -1
    if (autoSolving || !mistakes) { setCountIdx(-1); return }
    if (mistakes >= 3) { setCountIdx(b - 1); onReady?.(); return }
    if (mistakes >= 2) {
      const tick = () => {
        countPos.current = Math.min(b - 1, countPos.current + 1)
        setCountIdx(countPos.current)
        if (countPos.current < b - 1) {
          countTimer.current = window.setTimeout(tick, 600)
        } else {
          onReady?.()
        }
      }
      tick()
      return () => { if (countTimer.current) { clearTimeout(countTimer.current); countTimer.current = null } }
    }
    setCountIdx(-1)
  }, [mistakes, b, autoSolving, onReady])

  function onDragStart() { audio.drag() }

  function onDragEnd(ev: DragEndEvent) {
    if (typeof mistakes === 'number' && mistakes >= 1) return
    const id = Number(ev.active.id)
    const overId = ev.over?.id as string | undefined
    if (!overId) return
    audio.drop()

    const inPool = pool.includes(id)

    if (overId === 'pool') {
      // Return to pool from a cell
      if (!inPool) {
        setCells(prev => prev.map(c => c === id ? null : c))
        setPool(prev => [...prev, id])
      }
      return
    }

    if (overId.startsWith('cell-')) {
      const idx = parseInt(overId.split('-')[1])
      if (isNaN(idx)) return
      if (cells[idx] !== null) return // occupied
      if (inPool) {
        setPool(prev => prev.filter(x => x !== id))
        setCells(prev => prev.map((c, i) => i === idx ? id : c))
      } else {
        // Move from another cell
        const src = cells.findIndex(c => c === id)
        if (src === -1) return
        setCells(prev => prev.map((c, i) => i === src ? null : (i === idx ? id : c)))
      }
    }
  }

  const gridStyle: CSSProperties = { gridTemplateColumns: `repeat(${b}, minmax(0,1fr))` }
  // dynamic sizing based on number of columns (cap decision by visual density)
  const cols = Math.min(10, b)
  const tile = useMemo(() => {
    if (cols <= 3) return 96
    if (cols <= 5) return 72
    if (cols <= 8) return 56
    return 40
  }, [cols])
  const appleSize = Math.max(24, Math.round(tile * 0.75))

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className={`grid grid-cols-1 gap-3 ${mistake ? 'ring-2 ring-red-300 ring-offset-2' : ''}`}>
        {/* Array grid */}
        <div className={`border-2 border-dashed rounded-xl p-3 ${(autoSolving || (typeof mistakes === 'number' && mistakes >= 1)) ? 'pointer-events-none opacity-95' : ''}`}>
          <DroppableZone id="array" className="grid gap-2"/>
          <div className="grid gap-2 mt-1" style={gridStyle}>
            {cells.map((c, i) => (
              <DroppableZone key={i} id={`cell-${i}`} className="rounded-xl border border-gray-200 grid place-items-center" style={{ width: tile, height: tile }}>
                {c !== null && (
                  <DraggableItem id={c}>
                    <div className={`rounded-xl grid place-items-center bg-white shadow-soft ${lastAdded===c?'animate-pop':''} relative`} style={{ width: tile, height: tile }}>
                      <Apple size={appleSize} />
                      {/* Counting overlays */}
                      {typeof mistakes === 'number' && (
                        mistakes >= 3 ? (
                          <span className="absolute inset-0 grid place-items-center text-xs sm:text-sm font-black text-brand">{i + 1}</span>
                        ) : (mistakes >= 2 && Math.floor(i / b) === 0) ? (
                          <span className="absolute inset-0 grid place-items-center text-xs sm:text-sm font-black text-brand">{(i % b) < countIdx ? String((i % b) + 1) : ((i % b) === b - 1 ? '?' : '')}</span>
                        ) : null
                      )}
                      {typeof mistakes === 'number' && mistakes === 1 && i === 0 && (
                        <span className="absolute inset-0 grid place-items-center pointer-events-none text-2xl">👉</span>
                      )}
                      {typeof mistakes === 'number' && mistakes === 2 && Math.floor(i / b) === 0 && (i % b) === Math.min(countIdx, b - 1) && (
                        <span className="absolute inset-0 grid place-items-center pointer-events-none text-2xl">👉</span>
                      )}
                    </div>
                  </DraggableItem>
                )}
              </DroppableZone>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-bold">
            <span>{a}×{b}</span>
            <span>{cells.filter(c => c !== null).length}/{total}</span>
          </div>
        </div>

        {/* Pool */}
        <div className="border rounded-xl p-3">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <span>🧺</span><span>{t('pool')}</span>
            {(autoSolving || (typeof mistakes === 'number' && mistakes >= 1)) && (
              <span className="ml-auto text-[11px] text-gray-400 flex items-center gap-1"><span className="animate-pointer">👉</span>{t('countTogether')} {cells.filter(c => c !== null).length}/{total}</span>
            )}
          </div>
          <DroppableZone id="pool" className={`mt-2 flex flex-wrap gap-2 min-h-[120px] ${(autoSolving || (typeof mistakes === 'number' && mistakes >= 1)) ? 'pointer-events-none opacity-95' : ''}`}>
            {pool.map(id => (
              <DraggableItem id={id} key={id}>
                <div className={`rounded-xl grid place-items-center bg-white shadow-soft ${lastAdded===id?'animate-pop':''}`} style={{ width: tile, height: tile }}>
                  <Apple size={appleSize} />
                </div>
              </DraggableItem>
            ))}
          </DroppableZone>
        </div>
      </div>
    </DndContext>
  )
}

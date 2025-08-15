"use client"
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
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

  useEffect(() => { setPool(Array.from({ length: total }, (_, i) => i)); setCells(Array.from({ length: total }, () => null)) }, [a,b])

  useEffect(() => {
    if (cells.every(c => c !== null)) onReady?.()
  }, [cells, onReady])

  // Auto-solve: fill empty cells one-by-one from pool when mistake occurs
  useEffect(() => {
    if (!mistake || autoSolving) return
    setAutoSolving(true)
    const iv = setInterval(() => {
      const nextCell = cells.findIndex(c => c === null)
      if (nextCell === -1 || pool.length === 0) {
        clearInterval(iv)
        setAutoSolving(false)
        return
      }
      const id = pool[0]
      setPool(prev => prev.slice(1))
      setCells(prev => prev.map((c, i) => i === nextCell ? id : c))
      setLastAdded(id)
    }, 180)
    return () => clearInterval(iv)
  }, [mistake, autoSolving, cells, pool.length])

  function onDragStart() { audio.drag() }

  function onDragEnd(ev: DragEndEvent) {
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
    if (cols >= 10) return 32
    if (cols >= 8) return 36
    if (cols >= 6) return 44
    return 56
  }, [cols])
  const appleSize = Math.max(20, Math.round(tile * 0.66))

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className={`grid grid-cols-1 gap-3 ${mistake ? 'ring-2 ring-red-300 ring-offset-2' : ''}`}>
        {/* Array grid */}
        <div className={`border-2 border-dashed rounded-xl p-3 ${autoSolving ? 'pointer-events-none opacity-95' : ''}`}>
          <DroppableZone id="array" className="grid gap-2"/>
          <div className="grid gap-2 mt-1" style={gridStyle}>
            {cells.map((c, i) => (
              <DroppableZone key={i} id={`cell-${i}`} className="rounded-xl border border-gray-200 grid place-items-center" style={{ width: tile, height: tile }}>
                {c !== null && (
                  <DraggableItem id={c}>
                    <div className={`rounded-xl grid place-items-center bg-white shadow-soft ${lastAdded===c?'animate-pop':''}`} style={{ width: tile, height: tile }}>
                      <Apple size={appleSize} />
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
          <DroppableZone id="pool" className="mt-2 flex flex-wrap gap-2 min-h-[120px]">
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

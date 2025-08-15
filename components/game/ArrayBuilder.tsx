"use client"
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Apple } from '@/components/illustrations/Apple'
import { audio } from '@/lib/audio'
import { DraggableItem, DroppableZone } from './dnd'

export function ArrayBuilder({ a, b, onReady }: { a: number; b: number; onReady?: () => void }) {
  const total = a * b
  const [pool, setPool] = useState<number[]>(() => Array.from({ length: total }, (_, i) => i))
  const [cells, setCells] = useState<(number|null)[]>(() => Array.from({ length: total }, () => null))

  useEffect(() => { setPool(Array.from({ length: total }, (_, i) => i)); setCells(Array.from({ length: total }, () => null)) }, [a,b])

  useEffect(() => {
    if (cells.every(c => c !== null)) onReady?.()
  }, [cells, onReady])

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

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 gap-3">
        {/* Array grid */}
        <div className="border-2 border-dashed rounded-xl p-3">
          <DroppableZone id="array" className="grid gap-2"/>
          <div className="grid gap-2 mt-1" style={gridStyle}>
            {cells.map((c, i) => (
              <DroppableZone key={i} id={`cell-${i}`} className="w-14 h-14 rounded-xl border border-gray-200 grid place-items-center">
                {c !== null && (
                  <DraggableItem id={c}>
                    <div className="w-14 h-14 rounded-xl grid place-items-center bg-white shadow-soft">
                      <Apple size={36} />
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
          <DroppableZone id="pool" className="mt-2 flex flex-wrap gap-2 min-h-[120px]">
            {pool.map(id => (
              <DraggableItem id={id} key={id}>
                <div className="w-14 h-14 rounded-xl grid place-items-center bg-white shadow-soft">
                  <Apple size={36} />
                </div>
              </DraggableItem>
            ))}
          </DroppableZone>
        </div>
      </div>
    </DndContext>
  )
}

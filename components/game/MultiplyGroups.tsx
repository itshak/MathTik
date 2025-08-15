"use client"
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useEffect, useMemo, useState } from 'react'
import { Apple } from '@/components/illustrations/Apple'
import { Person } from '@/components/illustrations/Person'
import { audio } from '@/lib/audio'
import { DraggableItem, DroppableZone } from './dnd'

export function MultiplyGroups({ a, b, onReady }: { a: number; b: number; onReady?: () => void }) {
  const total = a * b
  const [pool, setPool] = useState<number[]>(() => Array.from({ length: total }, (_, i) => i))
  const [groups, setGroups] = useState<number[][]>(() => Array.from({ length: a }, () => []))

  useEffect(() => { setPool(Array.from({ length: total }, (_, i) => i)); setGroups(Array.from({ length: a }, () => [])) }, [a,b])

  // Ready when each group filled to b
  useEffect(() => {
    if (groups.every(g => g.length === b)) onReady?.()
  }, [groups, b, onReady])

  function onDragStart() { audio.drag() }

  function onDragEnd(ev: DragEndEvent) {
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

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 gap-3">
        {/* Groups */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {groups.map((g, i) => (
            <div key={i} className="border-2 border-dashed rounded-xl p-2">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Person size={36} /> <span className="text-base">×</span> <Apple size={36} />
              </div>
              <DroppableZone id={`group-${i}`} className="mt-2 grid grid-cols-5 gap-2 min-h-[120px]">
                {g.map(id => (
                  <DraggableItem id={id} key={id}>
                    <div className="w-14 h-14 rounded-xl grid place-items-center bg-white shadow-soft">
                      <Apple size={36} />
                    </div>
                  </DraggableItem>
                ))}
                {/* pad placeholders visually */}
                {Array.from({ length: Math.max(0, b - g.length) }).map((_, k) => (
                  <div key={k} className="w-14 h-14 rounded-xl border border-gray-200" />
                ))}
              </DroppableZone>
              <div className="text-[10px] mt-1 text-gray-400 font-bold">{g.length}/{b}</div>
            </div>
          ))}
        </div>

        {/* Pool */}
        <div className="border rounded-xl p-3">
          <div className="flex items-center gap-2 text-gray-500 text-xs"><span>Pool</span></div>
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

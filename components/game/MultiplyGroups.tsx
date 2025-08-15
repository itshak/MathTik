"use client"
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useEffect, useMemo, useState } from 'react'
import { Apple } from '@/components/illustrations/Apple'
import { Person } from '@/components/illustrations/Person'
import { audio } from '@/lib/audio'
import { DraggableItem, DroppableZone } from './dnd'
import { useI18n } from '@/lib/i18n'

export function MultiplyGroups({ a, b, mistake, onReady, mistakes }: { a: number; b: number; mistake?: boolean; onReady?: () => void; mistakes?: number }) {
  const t = useI18n()
  const total = a * b
  // Start with apples held by people; pool is empty
  const [pool, setPool] = useState<number[]>([])
  const [groups, setGroups] = useState<number[][]>(() =>
    Array.from({ length: a }, (_, gi) => Array.from({ length: b }, (_, j) => gi * b + j))
  )
  const [autoSolving, setAutoSolving] = useState(false)
  const [movedCount, setMovedCount] = useState(0)
  const [lastAdded, setLastAdded] = useState<number | null>(null)

  useEffect(() => {
    setPool([])
    setGroups(Array.from({ length: a }, (_, gi) => Array.from({ length: b }, (_, j) => gi * b + j)))
  }, [a, b])

  // Ready when all apples are moved to the pool
  useEffect(() => {
    if (pool.length === total) onReady?.()
  }, [pool.length, total, onReady])

  // Auto-solve: move remaining apples to pool one by one when mistake occurs
  useEffect(() => {
    if (!mistake || autoSolving) return
    setAutoSolving(true)
    // Build a flat list of remaining ids not in pool
    const seq: number[] = []
    groups.forEach(g => g.forEach(id => seq.push(id)))
    let i = 0
    const iv = setInterval(() => {
      if (i >= seq.length) {
        clearInterval(iv)
        setAutoSolving(false)
        return
      }
      const id = seq[i++]
      // remove from its current group and push to pool
      setGroups(prev => prev.map(g => g.includes(id) ? g.filter(x => x !== id) : g))
      setPool(prev => [...prev, id])
      setLastAdded(id)
      setMovedCount(c => c + 1)
    }, 180)
    return () => clearInterval(iv)
  }, [mistake, autoSolving, groups])

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

  // dynamic sizing: up to 10 per row in groups
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
        {/* Groups */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${autoSolving ? 'pointer-events-none opacity-95' : ''}`}>
          {groups.map((g, i) => (
            <div key={i} className="border-2 border-dashed rounded-xl p-2">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Person size={36} /> <span className="text-base">×</span> <Apple size={appleSize} />
              </div>
              <DroppableZone id={`group-${i}`} className="mt-2 grid gap-2 min-h-[120px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
                {g.map(id => (
                  <DraggableItem id={id} key={id}>
                    <div className={`rounded-xl grid place-items-center bg-white shadow-soft ${lastAdded===id?'animate-pop':''}`} style={{ width: tile, height: tile }}>
                      <Apple size={appleSize} />
                    </div>
                  </DraggableItem>
                ))}
                {/* pad placeholders visually */}
                {Array.from({ length: Math.max(0, b - g.length) }).map((_, k) => (
                  <div key={k} className="rounded-xl border border-gray-200" style={{ width: tile, height: tile }} />
                ))}
              </DroppableZone>
              <div className="text-[10px] mt-1 text-gray-400 font-bold">{g.length}/{b}</div>
            </div>
          ))}
        </div>

        {/* Pool */}
        <div className="border rounded-xl p-3">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <span>🧺</span><span>{t('pool')}</span>
            {(autoSolving || (typeof mistakes === 'number' && mistakes >= 1)) && (
              <span className="ml-auto text-[11px] text-gray-400 flex items-center gap-1"><span className="animate-pointer">👉</span>{t('countTogether')} {movedCount}/{total}</span>
            )}
          </div>
          <DroppableZone id="pool" className={`mt-2 flex flex-wrap gap-2 min-h-[120px] ${mistakes && mistakes >= 1 ? 'ring-2 ring-brand/40 rounded-xl p-2 -m-2' : ''}`}>
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

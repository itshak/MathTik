"use client"
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useEffect, useMemo, useState } from 'react'
import { Apple } from '@/components/illustrations/Apple'
import { Person } from '@/components/illustrations/Person'
import { audio } from '@/lib/audio'
import { DraggableItem, DroppableZone } from './dnd'
import { useI18n } from '@/lib/i18n'

export function DivisionDealer({ a, b, mistake, onReady, mistakes }: { a: number; b: number; mistake?: boolean; onReady?: () => void; mistakes?: number }) {
  const t = useI18n()
  const q = Math.floor(a / b)
  const [pool, setPool] = useState<number[]>(() => Array.from({ length: a }, (_, i) => i))
  const [friends, setFriends] = useState<number[][]>(() => Array.from({ length: b }, () => []))
  const [autoSolving, setAutoSolving] = useState(false)
  const [lastAdded, setLastAdded] = useState<number | null>(null)

  useEffect(() => { setPool(Array.from({ length: a }, (_, i) => i)); setFriends(Array.from({ length: b }, () => [])) }, [a,b])

  useEffect(() => {
    const done = pool.length === 0 && friends.every(f => f.length === q)
    if (done) onReady?.()
  }, [pool, friends, q, onReady])

  // Auto-solve: distribute remaining pool apples to friends until each has q
  useEffect(() => {
    if (!mistake || autoSolving) return
    setAutoSolving(true)
    const iv = setInterval(() => {
      // find next friend needing an apple
      const tgt = friends.findIndex(f => f.length < q)
      if (tgt === -1 || pool.length === 0) {
        clearInterval(iv)
        setAutoSolving(false)
        return
      }
      const id = pool[0]
      setPool(prev => prev.slice(1))
      setFriends(prev => prev.map((f, idx) => idx === tgt ? [...f, id] : f))
      setLastAdded(id)
    }, 180)
    return () => clearInterval(iv)
  }, [mistake, autoSolving, friends, pool.length, q])

  function onDragStart() { audio.drag() }

  function onDragEnd(ev: DragEndEvent) {
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

  // dynamic sizing: based on per-friend capacity q (cap rows to ~10 visually)
  const cols = Math.min(10, q)
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
        {/* Pool (no text) */}
        <div className="border rounded-xl p-3">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <span className="text-xl">🗃️</span>
            {(autoSolving || (typeof mistakes === 'number' && mistakes >= 1)) && (
              <span className="ml-auto text-[11px] text-gray-400 flex items-center gap-1"><span className="animate-pointer">👉</span>{t('countTogether')} {a - pool.length}/{a}</span>
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

        {/* Friends */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${autoSolving ? 'pointer-events-none opacity-95' : ''}`}>
          {friends.map((f, i) => (
            <div key={i} className="border-2 border-dashed rounded-xl p-2">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Person size={36} />
              </div>
              <DroppableZone id={`friend-${i}`} className="mt-2 flex flex-wrap gap-2 min-h-[120px]">
                {f.map(id => (
                  <DraggableItem id={id} key={id}>
                    <div className={`rounded-xl grid place-items-center bg-white shadow-soft ${lastAdded===id?'animate-pop':''}`} style={{ width: tile, height: tile }}>
                      <Apple size={appleSize} />
                    </div>
                  </DraggableItem>
                ))}
                {Array.from({ length: Math.max(0, q - f.length) }).map((_, k) => (
                  <div key={k} className="rounded-xl border border-gray-200" style={{ width: tile, height: tile }} />
                ))}
              </DroppableZone>
              <div className="text-[10px] mt-1 text-gray-400 font-bold">{f.length}/{q}</div>
            </div>
          ))}
        </div>
      </div>
    </DndContext>
  )
}

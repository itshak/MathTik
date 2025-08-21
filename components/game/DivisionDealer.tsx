"use client"
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  const [countIdx, setCountIdx] = useState<number>(-1) // for animated counting across apples
  const autoTimer = useRef<number | null>(null)
  const countTimer = useRef<number | null>(null)
  const countPos = useRef<number>(-1)

  useEffect(() => { setPool(Array.from({ length: a }, (_, i) => i)); setFriends(Array.from({ length: b }, () => [])) }, [a,b])

  useEffect(() => {
    const done = pool.length === 0 && friends.every(f => f.length === q)
    if (done) onReady?.()
  }, [pool, friends, q, onReady])

  // Auto-solve: distribute remaining pool apples to friends until each has q (stable across re-renders)
  useEffect(() => {
    if (!mistake || autoSolving) return
    setAutoSolving(true)

    const step = () => {
      let didMove = false
      setPool(prevPool => {
        if (prevPool.length === 0) return prevPool
        const id = prevPool[0]
        setFriends(prevFriends => {
          const tgt = prevFriends.findIndex(f => f.length < q)
          if (tgt === -1) return prevFriends
          didMove = true
          setLastAdded(id)
          return prevFriends.map((f, idx) => idx === tgt ? [...f, id] : f)
        })
        return prevPool.slice(1)
      })

      // schedule next step or finish
      autoTimer.current = window.setTimeout(() => {
        const done = pool.length === 0 && friends.every(f => f.length === q)
        if (done || !didMove) {
          setAutoSolving(false)
          autoTimer.current && clearTimeout(autoTimer.current)
          autoTimer.current = null
          // For first mistake, finish now; for subsequent mistakes, counting animation will call onReady
          if (!mistakes || mistakes < 2) onReady?.()
        } else {
          step()
        }
      }, 180)
    }

    step()

    return () => { if (autoTimer.current) { clearTimeout(autoTimer.current); autoTimer.current = null } }
  }, [mistake, autoSolving, q, onReady, pool.length, friends, mistakes])

  // Counting guidance animation for mistakes >= 2 (stable across re-renders)
  useEffect(() => {
    // clear any previous timer
    if (countTimer.current) { clearTimeout(countTimer.current); countTimer.current = null }
    countPos.current = -1

    if (autoSolving || !mistakes) { setCountIdx(-1); return }
    if (mistakes >= 3) { setCountIdx(q - 1); onReady?.(); return }
    if (mistakes >= 2) {
      const tick = () => {
        countPos.current = Math.min(q - 1, countPos.current + 1)
        setCountIdx(countPos.current)
        if (countPos.current < q - 1) {
          countTimer.current = window.setTimeout(tick, 600)
        } else {
          // reached last apple, now user must count it – then re-enable input
          onReady?.()
        }
      }
      tick()
      return () => { if (countTimer.current) { clearTimeout(countTimer.current); countTimer.current = null } }
    }
    setCountIdx(-1)
  }, [mistakes, q, autoSolving, onReady])

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
          <DroppableZone id="pool" className={`mt-2 flex flex-wrap gap-2 min-h-[120px] ${typeof mistakes === 'number' && mistakes >= 1 ? 'pointer-events-none opacity-95' : ''}`}>
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
        <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${(autoSolving || (typeof mistakes === 'number' && mistakes >= 1)) ? 'pointer-events-none opacity-95' : ''}`}>
          {friends.map((f, i) => (
            <div key={i} className="border-2 border-dashed rounded-xl p-2 relative">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Person size={36} />
              </div>
              <DroppableZone id={`friend-${i}`} className="mt-2 flex flex-wrap gap-2 min-h-[120px]">
                {f.map((id, j) => (
                  <DraggableItem id={id} key={id}>
                    <div className={`rounded-xl grid place-items-center bg-white shadow-soft ${lastAdded===id?'animate-pop':''} relative`} style={{ width: tile, height: tile }}>
                      <Apple size={appleSize} />
                      {/* Counting overlays */}
                      {typeof mistakes === 'number' && mistakes >= 2 && i === 0 && (
                        <span className="absolute top-0.5 left-0.5 text-[10px] font-black text-brand">
                          {mistakes >= 3 ? String(j + 1) : (j < countIdx ? String(j + 1) : (j === q - 1 ? '?' : ''))}
                        </span>
                      )}
                      {/* Moving pointer attached to current apple on second mistake */}
                      {typeof mistakes === 'number' && mistakes === 2 && i === 0 && j === Math.min(countIdx, q - 1) && (
                        <span className="absolute -top-2 -right-2 text-base animate-pointer">👉</span>
                      )}
                    </div>
                  </DraggableItem>
                ))}
                {Array.from({ length: Math.max(0, q - f.length) }).map((_, k) => (
                  <div key={k} className="rounded-xl border border-gray-200" style={{ width: tile, height: tile }} />
                ))}
              </DroppableZone>
              <div className="text-[10px] mt-1 text-gray-400 font-bold">{f.length}/{q}</div>
              {/* First mistake: static pointer to guide where to count */}
              {i === 0 && typeof mistakes === 'number' && mistakes === 1 && (
                <div className="absolute -top-2 -right-2 text-base animate-pointer">👉</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DndContext>
  )
}

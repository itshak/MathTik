"use client"
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Person } from '@/components/illustrations/Person'
import { Coin } from '@/components/illustrations/Coin'
import { CoinCountView } from './CoinUtils'
import { audio } from '@/lib/audio'
import { DraggableItem, DroppableZone } from './dnd'
import { useI18n } from '@/lib/i18n'
import { useGameStore } from '@/lib/store'

export function CoinsDivisionDealer({ a, b, mistake, onReady, mistakes, maxH }: { a: number; b: number; mistake?: boolean; onReady?: () => void; mistakes?: number; maxH?: number }) {
  const t = useI18n()
  const lang = useGameStore(s => s.profile.language || 'en')
  const isRTL = lang === 'he'
  const q = Math.floor(a / b)
  const [pool, setPool] = useState<number>(() => a)
  const [friends, setFriends] = useState<number[]>(() => Array.from({ length: b }, () => 0))
  const [lastId, setLastId] = useState<number | null>(null)
  const nextId = useRef(0)
  const autoTimer = useRef<number | null>(null)
  const autoRunId = useRef(0)
  const readySent = useRef(false)

  useEffect(() => { readySent.current = false }, [mistakes])
  useEffect(() => { setPool(a); setFriends(Array.from({ length: b }, () => 0)); nextId.current = 0 }, [a, b])

  useEffect(() => {
    const done = pool === 0 && friends.every(f => f === q)
    if (done && !readySent.current) { readySent.current = true; onReady?.() }
  }, [pool, friends, q, onReady])

  useEffect(() => {
    if (!mistake) return
    const needs = friends.map(f => Math.max(0, q - f))
    const seq: number[] = []
    needs.forEach((n, idx) => { for (let k = 0; k < n; k++) seq.push(idx) })
    let i = 0
    autoRunId.current += 1
    const thisRun = autoRunId.current
    const step = () => {
      if (thisRun !== autoRunId.current) return
      if (i >= seq.length) { if (!readySent.current) { readySent.current = true; onReady?.() } return }
      if (pool <= 0) { if (!readySent.current) { readySent.current = true; onReady?.() } return }
      const tgt = seq[i++]
      setPool(p => Math.max(0, p - 1))
      setFriends(prev => prev.map((f, idx) => idx === tgt ? Math.min(q, f + 1) : f))
      setLastId(nextId.current++)
      autoTimer.current = window.setTimeout(step, 160)
    }
    step()
    return () => { autoRunId.current += 1; if (autoTimer.current) { clearTimeout(autoTimer.current); autoTimer.current = null } }
  }, [mistake])

  function onDragStart() { audio.drag() }

  function onDragEnd(ev: DragEndEvent) {
    if (typeof mistakes === 'number' && mistakes >= 1) return
    const overId = ev.over?.id as string | undefined
    if (!overId) return
    audio.drop()
    if (!overId.startsWith('friend-')) return
    const idx = parseInt(overId.split('-')[1])
    if (isNaN(idx)) return
    if (friends[idx] >= q) return
    if (pool <= 0) return
    setPool(p => Math.max(0, p - 1))
    setFriends(prev => prev.map((f, i) => i === idx ? Math.min(q, f + 1) : f))
    setLastId(nextId.current++)
  }

  // Layout sizing
  const outerCols = useMemo(() => {
    if (b >= 8) return 5
    if (b >= 6) return 4
    return Math.min(3, b)
  }, [b])

  const token = useMemo(() => {
    if (b >= 8) return 32
    if (b >= 6) return 36
    return 40
  }, [b])

  const poolTokens = Math.min(pool, 40) // render up to 40 draggable coins; beyond that we still represent count visually

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className={`grid grid-cols-1 gap-3 ${mistake ? 'ring-2 ring-red-300 ring-offset-2' : ''}`}>
        {/* Pool */}
        <div className="border border-gray-300 rounded-xl p-3">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <span className="text-xl">🗃️</span>
            <span>{t('pool')}</span>
            <span className="ml-auto text-[11px] text-gray-400">{pool}</span>
          </div>
          <DroppableZone id="pool" className={`mt-2 flex flex-nowrap overflow-x-auto gap-2 ${(typeof mistakes === 'number' && mistakes >= 1) ? 'pointer-events-none opacity-95' : ''}`} style={{ minHeight: token }}>
            {/* Draggable unit coins */}
            {Array.from({ length: poolTokens }).map((_, i) => {
              const id = `p-${i}-${lastId ?? 0}`
              return (
                <DraggableItem id={id} key={id}>
                  <div className={`rounded-md grid place-items-center bg-white shadow-soft ${i===0 && 'animate-pop'}`} style={{ width: token, height: token }}>
                    <Coin size={Math.round(token * 0.8)} />
                  </div>
                </DraggableItem>
              )
            })}
            {/* Visual aggregate stacks for counts beyond draggable tokens */}
            {pool > poolTokens && (
              <div className="rounded-md bg-white shadow-soft grid place-items-center px-2 text-xs text-gray-600" style={{ height: token }}>
                +{pool - poolTokens}
              </div>
            )}
          </DroppableZone>
        </div>

        {/* Friends */}
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${outerCols}, minmax(0, 1fr))` }}>
          {friends.map((cnt, i) => (
            <div key={i} className="border border-gray-300 rounded-xl p-2">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Person size={Math.round(token * 0.9)} />
                <span className="ml-auto text-[11px] text-gray-400">{cnt}/{q}</span>
              </div>
              <DroppableZone id={`friend-${i}`} className="mt-2 grid place-items-center" style={{ minHeight: token }}>
                <CoinCountView count={cnt} size={token} />
              </DroppableZone>
            </div>
          ))}
        </div>
      </div>
    </DndContext>
  )
}

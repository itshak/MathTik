"use client"
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Person } from '@/components/illustrations/Person'
import { Coin } from '@/components/illustrations/Coin'
import { CoinCountView } from './CoinUtils'
import { audio } from '@/lib/audio'
import { DraggableItem, DroppableZone } from './dnd'
import { useI18n } from '@/lib/i18n'

export function CoinsMultiplyGroups({ a, b, mistake, onReady, mistakes, maxH }: { a: number; b: number; mistake?: boolean; onReady?: () => void; mistakes?: number; maxH?: number }) {
  const t = useI18n()
  const total = a * b
  const [pool, setPool] = useState<number>(() => total)
  const [groups, setGroups] = useState<number[]>(() => Array.from({ length: a }, () => 0))
  const [lastId, setLastId] = useState<number | null>(null)
  const nextId = useRef(0)
  const autoTimer = useRef<number | null>(null)
  const autoRunId = useRef(0)
  const readySent = useRef(false)

  useEffect(() => { readySent.current = false }, [mistakes])
  useEffect(() => { setPool(total); setGroups(Array.from({ length: a }, () => 0)); nextId.current = 0 }, [a, b, total])

  useEffect(() => {
    const done = pool === 0 && groups.every(g => g === b)
    if (done && !readySent.current) { readySent.current = true; onReady?.() }
  }, [pool, groups, b, onReady])

  useEffect(() => {
    if (!mistake) return
    // distribute remaining coins from pool to groups until each reaches b
    const needs = groups.map(g => Math.max(0, b - g))
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
      setGroups(prev => prev.map((g, idx) => idx === tgt ? Math.min(b, g + 1) : g))
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
    if (!overId.startsWith('group-')) return
    const idx = parseInt(overId.split('-')[1])
    if (isNaN(idx)) return
    if (groups[idx] >= b) return
    if (pool <= 0) return
    setPool(p => Math.max(0, p - 1))
    setGroups(prev => prev.map((g, i) => i === idx ? Math.min(b, g + 1) : g))
    setLastId(nextId.current++)
  }

  // Layout sizing
  const outerCols = useMemo(() => {
    if (a >= 8) return 5
    if (a >= 6) return 4
    return Math.min(3, a)
  }, [a])

  const token = useMemo(() => {
    if (a >= 8) return 32
    if (a >= 6) return 36
    return 40
  }, [a])

  const poolTokens = Math.min(pool, 40)

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className={`grid grid-cols-1 gap-3 ${mistake ? 'ring-2 ring-red-300 ring-offset-2' : ''}`}>
        {/* Pool */}
        <div className="border border-gray-300 rounded-xl p-3">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <span>🧺</span><span>{t('pool')}</span>
            <span className="ml-auto text-[11px] text-gray-400">{pool}</span>
          </div>
          <DroppableZone id="pool" className={`mt-2 flex flex-nowrap overflow-x-auto gap-2 ${(typeof mistakes === 'number' && mistakes >= 1) ? 'pointer-events-none opacity-95' : ''}`} style={{ minHeight: token }}>
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
            {pool > poolTokens && (
              <div className="rounded-md bg-white shadow-soft grid place-items-center px-2 text-xs text-gray-600" style={{ height: token }}>
                +{pool - poolTokens}
              </div>
            )}
          </DroppableZone>
        </div>

        {/* Groups */}
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${outerCols}, minmax(0, 1fr))` }}>
          {groups.map((cnt, i) => (
            <div key={i} className="border border-gray-300 rounded-xl p-2">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Person size={Math.round(token * 0.9)} />
                <span className="ml-auto text-[11px] text-gray-400">{cnt}/{b}</span>
              </div>
              <DroppableZone id={`group-${i}`} className="mt-2 grid place-items-center" style={{ minHeight: token }}>
                <CoinCountView count={cnt} size={token} />
              </DroppableZone>
            </div>
          ))}
        </div>
      </div>
    </DndContext>
  )
}

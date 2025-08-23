"use client"
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Person } from '@/components/illustrations/Person'
import { Coin } from '@/components/illustrations/Coin'
import { CoinStacks, splitIntoStacks } from './CoinUtils'
import { audio } from '@/lib/audio'
import { DraggableItem, DroppableZone } from './dnd'
import { useI18n } from '@/lib/i18n'
import { useGameStore } from '@/lib/store'

export function CoinsMultiplyGroups({ a, b, mistake, onReady, mistakes, maxH }: { a: number; b: number; mistake?: boolean; onReady?: () => void; mistakes?: number; maxH?: number }) {
  const t = useI18n()
  const lang = useGameStore(s => s.profile.language || 'en')
  const isRTL = lang === 'he'
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

  const poolStacks = useMemo(() => splitIntoStacks(pool), [pool])
  const pointerIdx = (typeof mistakes === 'number' && mistakes === 1) ? 0 : undefined
  const overlays = useMemo(() => {
    if (typeof mistakes !== 'number') return [] as (number[] | undefined)[]
    return groups.map((cnt, idx) => {
      const s = splitIntoStacks(cnt)
      if (mistakes >= 3) { let sum = 0; return s.map(v => (sum += v)) }
      if (mistakes === 2 && idx === 0) { return s.length > 0 ? [s[0]] : undefined }
      return undefined
    })
  }, [mistakes, groups])

  // Compute pool tile dimensions to avoid clipping stacked coins
  const poolCoinSize = useMemo(() => Math.round(token * 0.8), [token])
  const poolOverlap = useMemo(() => Math.max(2, Math.round(token * 0.2)), [token])
  const poolStackHeight = (c: number) => poolCoinSize + poolOverlap * (c - 1)
  const poolMinH = useMemo(() => poolStacks.length ? Math.max(...poolStacks.map(poolStackHeight)) : poolCoinSize, [poolStacks, poolCoinSize, poolOverlap])

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className={`grid grid-cols-1 gap-3 ${mistake ? 'ring-2 ring-red-300 ring-offset-2' : ''}`}>
        {/* Pool */}
        <div className="border border-gray-300 rounded-xl p-2">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <span>🧺</span><span>{t('pool')}</span>
            {/* Removed numeric hint for pool count */}
          </div>
          <DroppableZone id="pool" className={`mt-1 flex flex-nowrap items-center overflow-x-auto gap-2 py-1 ${(typeof mistakes === 'number' && mistakes >= 1) ? 'pointer-events-none opacity-95' : ''}`} style={{ minHeight: poolMinH }}>
            {poolStacks.map((c, si) => {
              const coinSize = poolCoinSize
              const overlap = poolOverlap
              const tileH = poolStackHeight(c)
              return (
                <div key={`s-${si}-${lastId ?? 0}`} className="relative rounded-md bg-white shadow-soft" style={{ width: token, height: tileH }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                    <div style={{ position: 'relative', width: coinSize, height: tileH }}>
                      {Array.from({ length: c }).map((_, ci) => {
                        const id = `p-${si}-${ci}-${lastId ?? 0}`
                        return (
                          <div key={id} style={{ position: 'absolute', left: 0, right: 0, bottom: ci * overlap, display: 'grid', placeItems: 'center', zIndex: 10 + ci }}>
                            <DraggableItem id={id}>
                              <div className={`grid place-items-center ${ci===c-1 ? 'animate-pop' : ''}`} style={{ width: coinSize, height: coinSize }}>
                                <Coin size={coinSize} />
                              </div>
                            </DraggableItem>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </DroppableZone>
        </div>

        {/* Groups */}
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${outerCols}, minmax(0, 1fr))` }}>
          {groups.map((cnt, i) => (
            <div key={i} className="border border-gray-300 rounded-xl p-1">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Person size={Math.round(token * 0.8)} />
                {/* Removed numeric hint for group progress */}
              </div>
              <DroppableZone id={`group-${i}`} className="mt-1 grid place-items-center py-1">
                <CoinStacks count={cnt} size={token} overlayNumbers={overlays[i]} pointerIndex={i===0 ? pointerIdx : undefined} rtl={isRTL} />
              </DroppableZone>
            </div>
          ))}
        </div>
      </div>
    </DndContext>
  )
}

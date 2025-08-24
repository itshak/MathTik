"use client"
import React, { useEffect } from 'react'

export function ChampionOverlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[999] grid place-items-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl px-6 py-6 w-[min(92vw,460px)] text-center select-none">
        <div className="text-6xl mb-2">🏆</div>
        <div className="text-2xl font-extrabold mb-2">Champion!</div>
        <p className="text-sm text-gray-600 mb-4">You completed Level 10. Entering Review Mode.</p>
        <div className="grid place-items-center mb-4">
          <div className="rounded-full bg-brand text-white w-28 h-28 grid place-items-center text-4xl font-black animate-badge-pop">
            ⭐️
          </div>
        </div>
        <button onClick={onClose} className="w-full px-4 py-2 rounded-lg bg-brand text-white font-semibold shadow-soft active:scale-95">Start Review</button>
      </div>
    </div>
  )
}

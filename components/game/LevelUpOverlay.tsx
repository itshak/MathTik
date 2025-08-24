"use client"
import React, { useEffect } from 'react'

export function LevelUpOverlay({ level, onClose }: { level: number; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[999] grid place-items-center bg-black/30 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl px-6 py-6 w-[min(92vw,420px)] text-center select-none">
        <div className="text-5xl mb-2 animate-salute">🫡</div>
        <div className="text-2xl font-extrabold mb-4">Level Up!</div>
        <div className="grid place-items-center mb-4">
          <div className="rounded-full bg-brand text-white w-24 h-24 grid place-items-center text-4xl font-black animate-badge-pop">
            {level}
          </div>
        </div>
        <button onClick={onClose} className="btn btn-primary w-full">Continue</button>
      </div>
    </div>
  )
}

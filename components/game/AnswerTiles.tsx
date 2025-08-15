"use client"
import clsx from 'clsx'

export function AnswerTiles({ values, correct, onSelect, disabled }: { values: number[]; correct: number; onSelect: (v:number)=>void; disabled?: boolean }) {
  return (
    <div className={clsx("grid grid-cols-2 sm:grid-cols-4 gap-3", disabled && 'opacity-60 pointer-events-none')}>
      {values.map(v => (
        <button key={v} onClick={() => onSelect(v)} className="btn btn-secondary text-3xl py-6">
          {v}
        </button>
      ))}
    </div>
  )
}

"use client"
import clsx from 'clsx'

export function AnswerTiles({ values, correct, onSelect, disabled, highlightCorrect }: { values: number[]; correct: number; onSelect: (v:number)=>void; disabled?: boolean; highlightCorrect?: boolean }) {
  return (
    <div className={clsx("grid grid-cols-2 sm:grid-cols-4 gap-3", disabled && 'opacity-60 pointer-events-none')}>
      {values.map(v => {
        const isCorrect = v === correct
        return (
          <button
            key={v}
            onClick={() => onSelect(v)}
            className={clsx(
              "btn btn-secondary text-3xl py-6",
              highlightCorrect && isCorrect && 'animate-pump'
            )}
            data-correct={isCorrect ? 'true' : 'false'}
          >
            {v}
          </button>
        )
      })}
    </div>
  )
}

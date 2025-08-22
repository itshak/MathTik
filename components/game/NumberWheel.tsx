"use client"
import clsx from 'clsx'
import { useMemo } from 'react'

export function NumberWheel({ min=0, max=100, value, onPick, disabled, correct, highlightCorrect }: { min?: number; max?: number; value?: number; onPick: (v:number)=>void; disabled?: boolean; correct?: number; highlightCorrect?: boolean }) {
  const nums = useMemo(() => {
    const a: number[] = []
    for (let i=min;i<=max;i++) a.push(i)
    return a
  }, [min,max])

  return (
    <div dir="ltr" className={clsx('overflow-x-auto card p-3', disabled && 'opacity-60 pointer-events-none')}>
      <div className="flex gap-3 w-max">
        {nums.map(n => {
          const isCorrect = typeof correct === 'number' && n === correct
          return (
            <button
              key={n}
              onClick={() => onPick(n)}
              className={clsx(
                'px-5 py-4 rounded-xl font-extrabold shadow-soft text-2xl',
                n===value ? 'bg-brand text-white' : 'bg-white border',
                highlightCorrect && isCorrect && 'animate-pump'
              )}
              data-correct={isCorrect ? 'true' : 'false'}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}

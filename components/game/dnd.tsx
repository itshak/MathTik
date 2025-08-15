"use client"
import { ReactNode, type CSSProperties } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import clsx from 'clsx'

export function DraggableItem({ id, children }: { id: string | number; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: String(id) })
  const style: CSSProperties = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : {}
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style} className={clsx(isDragging && 'opacity-70')}> 
      {children}
    </div>
  )
}

export function DroppableZone({ id, className, children }: { id: string; className?: string; children?: ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={clsx(className, isOver && 'ring-2 ring-brand/50')}>
      {children}
    </div>
  )
}

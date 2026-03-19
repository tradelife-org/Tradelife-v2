'use client'

import { ReactNode } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface SortableItemProps {
  id: string
  children: ReactNode
}

function SortableItem({ id, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 50 : 'auto' as const,
    position: 'relative' as const,
  }

  return (
    <div ref={setNodeRef} style={style} data-testid={`sortable-${id}`}>
      {/* Drag handle — top-right grip */}
      <div
        {...attributes}
        {...listeners}
        data-testid={`drag-handle-${id}`}
        className="absolute top-3 right-3 z-20 w-6 h-6 rounded-md flex items-center justify-center cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>
      {children}
    </div>
  )
}

interface SortableStackProps {
  items: string[]
  onReorder: (newOrder: string[]) => void
  renderWidget: (id: string) => ReactNode
  testId: string
  className?: string
}

export function SortableStack({ items, onReorder, renderWidget, testId, className = '' }: SortableStackProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = items.indexOf(active.id as string)
      const newIndex = items.indexOf(over.id as string)
      onReorder(arrayMove(items, oldIndex, newIndex))
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className={`space-y-5 ${className}`} data-testid={testId}>
          {items.map((id) => (
            <SortableItem key={id} id={id}>
              {renderWidget(id)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

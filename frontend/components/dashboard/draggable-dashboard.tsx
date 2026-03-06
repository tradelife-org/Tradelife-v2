'use client'

import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core'
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable'
import { useState } from 'react'
import { JarvisHub } from '@/components/dashboard/JarvisHub'
import { 
  AttentionNeeded, 
  ActiveProjects, 
  LiveProjects, 
  TTESchedule, 
  FinancialOverview,
  ServiceTrafficLights
} from '@/components/dashboard/Widgets'
import { SortableWidget } from './SortableWidget'

export default function DraggableDashboard({ data }: { data: any }) {
  // Widget Config
  const [widgets, setWidgets] = useState([
    { id: 'attention', component: <AttentionNeeded items={data.attention_needed} /> },
    { id: 'active', component: <ActiveProjects items={data.active_projects} /> },
    { id: 'live', component: <LiveProjects items={data.live_projects} /> },
    { id: 'financial', component: <FinancialOverview data={data.financial_overview} /> },
    { id: 'service', component: <ServiceTrafficLights items={data.service_status} /> },
    { id: 'schedule', component: <TTESchedule items={data.tte_schedule} /> },
  ])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: any) {
    const { active, over } = event
    if (active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id)
        const newIndex = items.findIndex(i => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* Fixed Jarvis Hub (Always Top Left or Center) */}
        <div className="col-span-1 md:col-span-2 xl:col-span-2 min-h-[300px]">
          <JarvisHub />
        </div>

        <SortableContext items={widgets} strategy={verticalListSortingStrategy}>
          {widgets.map(widget => (
            <SortableWidget key={widget.id} id={widget.id}>
              {widget.component}
            </SortableWidget>
          ))}
        </SortableContext>

      </div>
    </DndContext>
  )
}

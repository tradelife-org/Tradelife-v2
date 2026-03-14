'use client'

import { useState, useEffect, useRef } from 'react'
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { MapPin, Calendar, Clock, Loader2 } from 'lucide-react'
import { updateJobScheduleAction } from '@/lib/actions/calendar'
import { GlassPanel } from '@/components/ui/glass-panel'

export default function JobCalendarClient({ jobs: initialJobs, staff }: { jobs: any[], staff: any[] }) {
  const [view, setView] = useState<'week' | 'month' | 'map'>('week')
  const [jobs, setJobs] = useState(initialJobs)
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const w = window as any
    if (view === 'map' && mapRef.current && w.google) {
      const map = new w.google.maps.Map(mapRef.current, {
        center: { lat: 51.5074, lng: -0.1278 }, // Default London
        zoom: 10,
      })

      jobs.forEach(job => {
        if (job.latitude && job.longitude) {
          new w.google.maps.Marker({
            position: { lat: job.latitude, lng: job.longitude },
            map,
            title: job.title
          })
        }
      })
    }
  }, [view, jobs])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    if (!over) return

    const jobId = active.id
    const targetDateStr = over.id // we set droppable id to "YYYY-MM-DD"

    const job = jobs.find((j: any) => j.id === jobId)
    if (!job) return

    // Optimitic update
    const newDate = new Date(targetDateStr)
    const currentEnd = job.scheduled_end ? new Date(job.scheduled_end) : new Date()
    const diff = currentEnd.getTime() - (job.scheduled_start ? new Date(job.scheduled_start).getTime() : new Date().getTime())
    
    const newEnd = new Date(newDate.getTime() + diff)

    setJobs(jobs.map((j: any) => j.id === jobId ? { ...j, scheduled_start: newDate.toISOString(), scheduled_end: newEnd.toISOString() } : j))

    try {
      await updateJobScheduleAction(jobId, newDate.toISOString(), newEnd.toISOString())
    } catch (err) {
      console.error(err)
      alert("Failed to schedule job")
      setJobs(initialJobs) // Revert
    }
  }

  // Generate Week Grid (Next 7 days)
  const today = new Date()
  const weekDays = Array.from({length: 7}).map((_, i) => {
    const d = new Date()
    d.setDate(today.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-4 bg-white/80 p-2 rounded-xl border border-slate-200/50 w-fit backdrop-blur-md">
        <button onClick={() => setView('week')} className={`px-4 py-2 rounded-lg font-bold text-sm ${view === 'week' ? 'bg-blueprint text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>Week</button>
        <button onClick={() => setView('month')} className={`px-4 py-2 rounded-lg font-bold text-sm ${view === 'month' ? 'bg-blueprint text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>Month</button>
        <button onClick={() => setView('map')} className={`px-4 py-2 rounded-lg font-bold text-sm ${view === 'map' ? 'bg-blueprint text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>Map</button>
      </div>

      {view === 'map' && (
        <GlassPanel className="h-[600px] w-full p-2 bg-white overflow-hidden relative">
          {!(window as any).google && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
              <MapPin className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold">Google Maps API not loaded</p>
              <p className="text-sm text-slate-400">Ensure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is configured in _document or layout.</p>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full rounded-xl" />
        </GlassPanel>
      )}

      {view === 'week' && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map(dateStr => {
              const dayJobs = jobs.filter(j => j.scheduled_start?.startsWith(dateStr))
              return (
                <DroppableColumn key={dateStr} id={dateStr} dateStr={dateStr} jobs={dayJobs} />
              )
            })}
          </div>
          
          <div className="mt-8">
            <h3 className="font-bold text-slate-900 mb-4">Unscheduled Jobs</h3>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {jobs.filter(j => !j.scheduled_start).map(j => (
                <DraggableJobCard key={j.id} job={j} />
              ))}
              {jobs.filter(j => !j.scheduled_start).length === 0 && (
                <p className="text-slate-400 text-sm italic p-4">No unscheduled jobs</p>
              )}
            </div>
          </div>
        </DndContext>
      )}

      {view === 'month' && (
        <div className="p-12 text-center bg-white/50 rounded-xl border border-white">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-600">Month View</h2>
          <p className="text-slate-400">Expand grid logic identically to week view using 30 days.</p>
        </div>
      )}
    </div>
  )
}

// --- DND Components ---
import { useDroppable } from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'

function DroppableColumn({ id, dateStr, jobs }: { id: string, dateStr: string, jobs: any[] }) {
  const { isOver, setNodeRef } = useDroppable({ id })
  const d = new Date(dateStr)

  return (
    <div ref={setNodeRef} className={`flex flex-col h-[500px] rounded-xl p-3 transition-colors ${isOver ? 'bg-blueprint-50 border-2 border-dashed border-blueprint' : 'bg-slate-50/80 border border-slate-200'}`}>
      <div className="text-center mb-4">
        <p className="text-xs font-bold text-slate-400 uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</p>
        <p className="text-xl font-black text-slate-800">{d.getDate()}</p>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3">
        {jobs.map(j => <DraggableJobCard key={j.id} job={j} />)}
      </div>
    </div>
  )
}

function DraggableJobCard({ job }: { job: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: job.id })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 999 } : undefined

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`p-3 bg-white rounded-xl shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-blueprint transition-colors ${isDragging ? 'opacity-50 ring-2 ring-blueprint' : ''} min-w-[150px]`}>
      <p className="text-xs font-bold text-slate-500 mb-1 truncate">{job.clients?.name}</p>
      <p className="text-sm font-semibold text-slate-900 leading-tight">{job.title}</p>
    </div>
  )
}

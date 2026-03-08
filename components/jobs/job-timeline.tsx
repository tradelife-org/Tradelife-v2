'use client'

import { GlassPanel } from '@/components/ui/glass-panel'
import { Calendar, CheckCircle, Flag, Info } from 'lucide-react'

export default function JobTimeline({ timeline }: { timeline: any[] }) {
  if (timeline.length === 0) return null

  return (
    <GlassPanel className="p-6 bg-white border-slate-200">
      <h3 className="font-heading font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Flag className="w-5 h-5 text-blueprint" />
        Job Timeline
      </h3>

      <div className="relative pl-4 space-y-8">
        <div className="absolute left-[23px] top-2 bottom-4 w-0.5 bg-slate-100" />

        {timeline.map((event, idx) => (
          <div key={event.id} className="relative pl-8">
            <div className={`absolute left-4 -translate-x-1/2 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10
              ${event.event_type === 'MILESTONE' ? 'bg-blueprint' : 'bg-slate-300'}`} />
            
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {new Date(event.event_date).toLocaleDateString()}
                </span>
                <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded text-slate-500 uppercase border border-slate-200">
                  {event.event_type}
                </span>
              </div>
              <h4 className="font-bold text-slate-800 text-sm">{event.title}</h4>
              {event.description && <p className="text-xs text-slate-500 mt-1">{event.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  )
}

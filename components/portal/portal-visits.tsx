import { GlassPanel } from '@/components/ui/glass-panel'
import { Calendar, Clock, MapPin } from 'lucide-react'

export default function PortalVisits({ visits }: { visits: any[] }) {
  if (!visits || visits.length === 0) return null

  return (
    <div className="space-y-4">
      <h3 className="font-heading font-bold text-white text-lg flex items-center gap-2">
        <Calendar className="w-5 h-5 text-safety" />
        Upcoming Visits
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visits.map(visit => {
          const isToday = new Date(visit.start_time).toDateString() === new Date().toDateString()
          const isInProgress = visit.status === 'IN_PROGRESS'
          
          return (
            <GlassPanel key={visit.id} className="p-4 bg-white/10 border-white/20 hover:bg-white/20 transition-all relative overflow-hidden group">
              {/* Molten Copper Pulse for Active/Today */}
              {(isToday || isInProgress) && (
                <div className="absolute top-0 right-0 w-2 h-2 m-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-safety opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-safety"></span>
                </div>
              )}

              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 bg-white/5 px-2 py-0.5 rounded">
                  {visit.visit_type.replace('_', ' ')}
                </span>
              </div>

              <h4 className="font-bold text-white text-lg mb-1">{visit.title}</h4>
              
              <div className="flex items-center gap-2 text-sm text-white/80 mt-2">
                <Clock className="w-4 h-4 text-safety" />
                <span>
                  {new Date(visit.start_time).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                  {' • '}
                  {new Date(visit.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </GlassPanel>
          )
        })}
      </div>
    </div>
  )
}

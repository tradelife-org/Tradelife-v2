import { GlassPanel } from '@/components/ui/glass-panel'
import { CheckCircle, Circle, Clock } from 'lucide-react'
import JobChat from '@/components/portal/job-chat' // New Component

interface TimelineEvent {
  id: string
  type: string
  title: string
  date: string
  status: string
  amount?: number
  start?: string
}

export default function PortalTimeline({ quotes, jobs, token }: { quotes: any[], jobs: any[], token: string }) {
  // Merge and sort events
  const events: TimelineEvent[] = [
    ...quotes.map(q => ({
      id: q.id,
      type: 'QUOTE',
      title: q.reference || 'Quote Created',
      date: q.created_at,
      status: q.status,
      amount: q.quote_amount_gross
    })),
    ...jobs.map(j => ({
      id: j.id,
      type: 'JOB',
      title: j.title,
      date: j.created_at,
      status: j.status,
      start: j.target_start_date
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const formatPence = (p: number) => (p / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })

  return (
    <div className="space-y-8">
      {/* Timeline List */}
      <GlassPanel className="p-6 bg-white/40 border-white/40 shadow-xl backdrop-blur-[14px]">
        <h3 className="font-heading font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blueprint" />
          Project Timeline
        </h3>

        <div className="relative pl-4 space-y-8">
          <div className="absolute left-[23px] top-2 bottom-4 w-0.5 bg-gradient-to-b from-blueprint/50 to-transparent" />

          {events.map((event, idx) => {
            const isJob = event.type === 'JOB'
            return (
              <div key={event.id} className="relative pl-8 animate-slide-in" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className={`absolute left-4 -translate-x-1/2 top-1.5 w-4 h-4 rounded-full border-2 
                  ${isJob ? 'bg-safety border-safety shadow-lg shadow-safety/30' : 'bg-white border-blueprint'} z-10`} />

                <div className="bg-white/60 p-4 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 inline-block
                        ${isJob ? 'bg-safety/10 text-safety-600' : 'bg-blueprint/10 text-blueprint'}`}>
                        {event.type}
                      </span>
                      <h4 className="font-bold text-slate-800">{event.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>
                    {event.amount !== undefined && (
                      <span className="font-mono font-bold text-slate-700">{formatPence(event.amount)}</span>
                    )}
                  </div>
                  
                  {isJob && event.start && (
                    <div className="mt-3 text-xs bg-slate-50/50 p-2 rounded border border-slate-100/50 inline-block">
                      Target Start: <span className="font-semibold">{new Date(event.start).toLocaleDateString()}</span>
                    </div>
                  )}

                  {/* Task 2: Private Comms Engine per Job */}
                  {isJob && (
                    <div className="mt-4 pt-4 border-t border-slate-200/50">
                      <JobChat token={token} jobId={event.id} jobTitle={event.title} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </GlassPanel>
    </div>
  )
}

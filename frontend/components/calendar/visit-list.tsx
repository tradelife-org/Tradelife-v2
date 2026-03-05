'use client'

import { useState } from 'react'
import { GlassPanel } from '@/components/ui/glass-panel'
import { Calendar, Clock, MapPin, Plus, User } from 'lucide-react'
import VisitForm from './visit-form'

export default function VisitList({ visits, jobs, staff }: { visits: any[], jobs: any[], staff: any[] }) {
  const [showForm, setShowForm] = useState(false)

  // Group by Date
  const grouped = visits.reduce((acc: any, visit: any) => {
    const date = new Date(visit.start_time).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(visit)
    return acc
  }, {})

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-heading font-bold text-slate-900">Schedule</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="btn-primary bg-blueprint text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:bg-blueprint-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Visit
        </button>
      </div>

      {showForm && (
        <VisitForm 
          jobs={jobs} 
          staff={staff} 
          onClose={() => setShowForm(false)} 
        />
      )}

      <div className="space-y-8">
        {Object.keys(grouped).length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No visits scheduled.
          </div>
        )}

        {Object.entries(grouped).map(([date, items]) => {
          const visitItems = items as any[]
          return (
            <div key={date}>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 sticky top-20 bg-slate-50/90 backdrop-blur py-2 z-10">
                {new Date(visitItems[0].start_time).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              
              <div className="space-y-4">
                {visitItems.map((visit: any) => (
                  <GlassPanel key={visit.id} className="p-4 bg-white border-slate-200 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      {/* Time Column */}
                      <div className="w-16 text-center shrink-0 pt-1">
                        <p className="font-bold text-slate-900">
                          {new Date(visit.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(visit.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-800 text-lg">{visit.title}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase
                            ${visit.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-600' : 
                              visit.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                            {visit.status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <p className="text-sm text-slate-600 mb-2">
                          {visit.jobs?.title} • {visit.jobs?.clients?.name}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                            <MapPin className="w-3 h-3" />
                            Site Visit
                          </span>
                          
                          {visit.visit_assignments?.length > 0 && (
                            <div className="flex -space-x-2">
                              {visit.visit_assignments.map((assign: any) => (
                                <div key={assign.id} className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-blueprint" title={assign.profiles?.full_name}>
                                  {assign.profiles?.full_name?.[0] || 'S'}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassPanel>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

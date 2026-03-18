'use client'

import { useState, useEffect } from 'react'
import { GlassPanel } from '@/components/ui/glass-panel'
import { X, Calendar, DollarSign, FileText, MessageSquare, Sun } from 'lucide-react'

export default function MorningBriefModal({ brief }: { brief?: any }) {
  const [isOpen, setIsOpen] = useState(false)
  
  useEffect(() => {
    // Check if seen today
    const seen = localStorage.getItem('morningBriefSeen')
    const today = new Date().toDateString()
    
    if (seen !== today && brief) {
      setIsOpen(true)
      localStorage.setItem('morningBriefSeen', today)
    }
  }, [brief])

  if (!isOpen || !brief) return null

  const data = brief

  const formatPence = (p: number) => (p / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <GlassPanel className="w-full max-w-2xl bg-slate-900 text-white border-slate-700 shadow-2xl relative overflow-hidden">
        {/* Background Effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>

        <div className="p-8 relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <Sun className="w-8 h-8 text-orange-400" />
            <div>
              <h2 className="text-2xl font-heading font-bold text-white">Good Morning, {data.userName}</h2>
              <p className="text-white/60">Here is your daily briefing.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-emerald-400">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Cash Position</span>
              </div>
              <p className="text-2xl font-mono font-bold">{formatPence(data.balance || 0)}</p>
            </div>
            
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-blue-400">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Drafts Pending</span>
              </div>
              <p className="text-2xl font-mono font-bold">{data.draftCount || 0}</p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-purple-400">
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Unread Messages</span>
              </div>
              <p className="text-2xl font-mono font-bold">{data.unreadCount || 0}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-400" />
              Upcoming Schedule
            </h3>
            <div className="space-y-3">
              {(!data.bookings || data.bookings.length === 0) && <p className="text-white/40 italic text-sm">No bookings this week.</p>}
              {data.bookings && data.bookings.map((booking: any) => (
                <div key={booking.id} className="flex items-center gap-4 p-3 bg-white/5 border border-white/5 rounded-lg">
                  <div className="w-12 text-center border-r border-white/10 pr-4">
                    <span className="block text-xs text-white/60 font-bold uppercase">{new Date(booking.start_time).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                    <span className="block text-lg font-bold">{new Date(booking.start_time).getDate()}</span>
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{booking.title}</p>
                    <p className="text-xs text-white/50">{new Date(booking.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setIsOpen(false)}
            className="w-full mt-8 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors"
          >
            Start Day
          </button>
        </div>
      </GlassPanel>
    </div>
  )
}

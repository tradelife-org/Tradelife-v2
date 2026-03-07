'use client'

import { markMessageReadAction } from '@/lib/actions/assistant'
import { GlassPanel } from '@/components/ui/glass-panel'
import { Mail, MessageSquare, AlertTriangle, CreditCard, Check } from 'lucide-react'

export default function InboxList({ messages }: { messages: any[] }) {
  if (messages.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
      <p>Inbox Zero</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <GlassPanel 
          key={msg.id} 
          className={`p-4 border transition-all hover:shadow-md cursor-pointer group
            ${msg.is_read ? 'bg-white border-slate-100 opacity-60' : 'bg-white border-blueprint/30 shadow-sm'}`}
          onClick={() => !msg.is_read && markMessageReadAction(msg.id)}
        >
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase
                ${msg.source === 'PORTAL' ? 'bg-purple-50 text-purple-600' : 
                  msg.source === 'EMAIL' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                {msg.source}
              </span>
              <span className="text-xs font-bold text-slate-700">{msg.sender || 'Unknown'}</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <p className={`text-sm text-slate-800 line-clamp-2 ${msg.is_read ? '' : 'font-medium'}`}>
            {msg.content}
          </p>

          {/* Tags */}
          {msg.tags && msg.tags.length > 0 && (
            <div className="flex gap-2 mt-2">
              {msg.tags.includes('URGENT') && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  <AlertTriangle className="w-3 h-3" /> Urgent
                </span>
              )}
              {msg.tags.includes('FINANCE') && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  <CreditCard className="w-3 h-3" /> Finance
                </span>
              )}
            </div>
          )}
        </GlassPanel>
      ))}
    </div>
  )
}

'use client'

import { Play, Lock } from 'lucide-react'
import { GlassPanel } from '@/components/ui/glass-panel'

interface VideoPlayerProps {
  title: string
  summary: string
  thumbnail?: string
}

export function VideoPlayer({ title, summary }: VideoPlayerProps) {
  return (
    <GlassPanel className="aspect-video bg-slate-900 relative overflow-hidden group border-slate-700">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950" />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm mb-4 group-hover:scale-110 transition-transform">
          <Play className="w-6 h-6 text-white ml-1 opacity-50" />
        </div>
        <h3 className="text-lg font-heading font-bold text-white mb-2">Video Coming Soon</h3>
        <p className="text-sm text-slate-400 max-w-sm">{summary}</p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-white font-bold text-sm">{title}</p>
      </div>
    </GlassPanel>
  )
}

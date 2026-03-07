'use client'

import * as React from 'react'
import { Info } from 'lucide-react'

export function GlassTooltip({ content, children }: { content: string, children?: React.ReactNode }) {
  const [isVisible, setIsVisible] = React.useState(false)

  return (
    <div 
      className="relative inline-flex items-center" 
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children || <Info className="w-4 h-4 text-slate-400 hover:text-blueprint cursor-help transition-colors" />}
      
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900/90 backdrop-blur-md text-white text-xs rounded-lg shadow-xl z-50 animate-fade-in border border-white/10">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/90" />
        </div>
      )}
    </div>
  )
}

'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bell, Menu, User, Loader2 } from 'lucide-react'

interface CommandCenterShellProps {
  children: React.ReactNode
}

export function CommandCenterShell({ children }: CommandCenterShellProps) {
  React.useEffect(() => {
    fetch('/api/bootstrap').catch(console.error)
  }, [])

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-16 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          
          {/* Left: Branding */}
          <div className="flex items-center gap-4">
            <div className="relative w-8 h-8 rounded-md overflow-hidden shadow-sm border border-slate-100">
             {/* Union Jack */}
              <img 
                src="https://images.unsplash.com/photo-1706814567827-c204d90a40c7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTV8MHwxfHNlYXJjaHwyfHxVbmlvbiUyMEphY2slMjBmbGFnfGVufDB8fHx8MTc3MjY2NDY3N3ww&ixlib=rb-4.1.0&q=85"
                alt="Union Jack"
                className="object-cover w-full h-full"
              />
            </div>
            <span className="text-xl font-heading font-black text-slate-900 tracking-tight">
              TradeLife<span className="text-blue-600">.</span>
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            
            <div className="h-8 w-px bg-slate-200 mx-1"></div>

            <div className="flex items-center gap-3 pl-1">
              <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 text-slate-500 overflow-hidden">
                <User className="w-5 h-5" />
              </div>
              <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

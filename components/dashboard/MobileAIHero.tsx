'use client'

import { DollarSign, Calendar, AlertTriangle, TrendingUp } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'

const quickActions = [
  { id: 'finances', label: 'Check finances', icon: DollarSign },
  { id: 'week', label: 'Plan week', icon: Calendar },
  { id: 'risks', label: 'Risks & delays', icon: AlertTriangle },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
]

export function MobileAIHero() {
  const setAiCoreOpen = useUIStore((s) => s.setAiCoreOpen)

  return (
    <div className="lg:hidden" data-testid="mobile-ai-hero">
      <div className="panel-material p-6">
        <div className="relative z-[1]">
          {/* AI Orb */}
          <div className="flex flex-col items-center mb-6">
            <button
              data-testid="mobile-ai-orb"
              onClick={() => setAiCoreOpen(true)}
              className="relative w-20 h-20 rounded-full flex items-center justify-center mb-4 cursor-pointer"
              style={{
                background: 'radial-gradient(circle at 45% 40%, rgba(59,130,246,0.25), rgba(59,130,246,0.08) 50%, rgba(59,130,246,0.02) 70%, transparent 100%)',
                boxShadow: '0 0 40px rgba(59,130,246,0.12), 0 0 80px rgba(59,130,246,0.06)',
                animation: 'mobile-orb-pulse 4s ease-in-out infinite',
              }}
            >
              <span className="text-2xl font-bold text-[var(--accent)]">T</span>
            </button>
            <h2 className="text-base font-semibold text-[var(--text-primary)] text-center">
              How can I help today?
            </h2>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2" data-testid="mobile-quick-actions">
            {quickActions.map((action) => (
              <button
                key={action.id}
                data-testid={`mobile-action-${action.id}`}
                onClick={() => setAiCoreOpen(true)}
                className="flex items-center gap-2.5 px-3.5 py-3 rounded-[var(--radius-md)] inset-material border border-[var(--border)] text-left"
              >
                <action.icon className="w-4 h-4 text-[var(--accent)] shrink-0" />
                <span className="text-xs font-medium text-[var(--text-secondary)]">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

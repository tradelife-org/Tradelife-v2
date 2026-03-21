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
      {/* Orb — standalone, NOT inside a panel */}
      <div className="flex flex-col items-center pt-4 pb-6">
        
        <h2 className="text-base font-semibold text-[var(--text-primary)] text-center mt-5">
          How can I help today?
        </h2>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2 px-1" data-testid="mobile-quick-actions">
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
  )
}

'use client'

import { Plus, FileText, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { AIOrb } from '@/components/ui/AIOrb'

const overviewStats = [
  { label: 'Revenue', value: '£24,500', change: '+12%', positive: true },
  { label: 'Expenses', value: '£8,200', change: '+3%', positive: false },
  { label: 'Net Profit', value: '£16,300', change: '+18%', positive: true },
  { label: 'Outstanding', value: '£4,100', change: '-8%', positive: true },
]

export function CenterCore() {
  return (
    <div className="hidden lg:block lg:col-span-6 space-y-5">
      {/* AI Orb Hero — standalone, NOT inside a panel */}
      <div className="flex flex-col items-center py-8" data-testid="ai-core-placeholder">
        <AIOrb size="lg" data-testid="ai-core-button" />
        <h2 className="text-base font-semibold text-[var(--text-primary)] mt-5">How can I help today?</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Your intelligent command centre</p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3" data-testid="action-buttons">
        <Button data-testid="action-new-quote" className="gap-2">
          <Plus className="w-3.5 h-3.5" /> New Quote
        </Button>
        <Button data-testid="action-new-invoice" className="gap-2">
          <FileText className="w-3.5 h-3.5" /> New Invoice
        </Button>
        <Button data-testid="action-view-reports" className="gap-2">
          <BarChart3 className="w-3.5 h-3.5" /> Reports
        </Button>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3" data-testid="overview-grid">
        {overviewStats.map((stat) => (
          <Panel key={stat.label}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">{stat.label}</span>
              {stat.positive ? <ArrowUpRight className="w-3.5 h-3.5 text-[var(--success)]" /> : <ArrowDownRight className="w-3.5 h-3.5 text-[var(--danger)]" />}
            </div>
            <div className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">{stat.value}</div>
            <div className="text-[11px] font-medium mt-1" style={{ color: stat.positive ? 'var(--success)' : 'var(--danger)' }}>
              {stat.change} from last month
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}
